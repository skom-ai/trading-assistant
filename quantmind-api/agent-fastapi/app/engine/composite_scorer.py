"""Deterministic composite scoring + ranking (FR2 / STOCK-203).

File: app/engine/composite_scorer.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Normalizes each factor across the current universe snapshot, applies a
    VERSIONED weight set, produces a composite score, and selects the
    deterministic top-10 with a stable tie-break by symbol. Running twice
    on the same input yields byte-identical output. NO LLM, no network.

Source: specs/arch/DDD.md §2.3
"""
from __future__ import annotations

import logging

from app.domain.enums import FactorName
from app.domain.schemas import ScannerFactorValue, ScannerRow

logger = logging.getLogger(__name__)

# Versioned weight sets (config, not code-embedded logic). Higher composite
# = more attractive screen. RSI is centered so extreme overbought is
# penalized; valuation z-score is inverted (cheaper vs universe scores higher).
WEIGHT_SETS: dict[int, dict[FactorName, float]] = {
    1: {
        FactorName.MOMENTUM_3M: 0.25,
        FactorName.MOMENTUM_6M: 0.25,
        FactorName.RSI_14: 0.15,
        FactorName.VOLUME_TREND: 0.15,
        FactorName.VALUATION_ZSCORE: 0.20,
    }
}


def _min_max(values: list[float]) -> tuple[float, float]:
    """Return (min, max) for a non-empty numeric list."""
    return min(values), max(values)


def _normalize_factor(name: FactorName, raw: float | None, lo: float, hi: float) -> float:
    """Normalize one raw factor value into [0, 1] with factor-specific sign.

    Args:
        name: The factor being normalized.
        raw: The raw value (None -> neutral 0.5).
        lo: Universe minimum for this factor.
        hi: Universe maximum for this factor.

    Returns:
        A normalized score in [0, 1]; higher is more attractive.
    """
    if raw is None or hi - lo <= 1e-12:
        return 0.5
    scaled = (raw - lo) / (hi - lo)
    # Valuation z-score: cheaper (lower z) is better -> invert.
    if name == FactorName.VALUATION_ZSCORE:
        return 1.0 - scaled
    # RSI: reward the ~50 midpoint, penalize extreme overbought/oversold.
    if name == FactorName.RSI_14:
        return 1.0 - abs(raw - 50.0) / 50.0
    return scaled


def score_and_rank(
    factors_by_symbol: dict[str, list[ScannerFactorValue]],
    weight_version: int,
    top_n: int = 10,
) -> list[ScannerRow]:
    """Normalize, weight, and rank the universe deterministically.

    Args:
        factors_by_symbol: Raw factor values keyed by ticker symbol.
        weight_version: Which versioned weight set to apply.
        top_n: How many rows to return (default 10).

    Returns:
        The top-N ScannerRow list, rank 1..N, stable tie-break by symbol.
    """
    weights = WEIGHT_SETS[weight_version]
    # Universe min/max per factor for normalization bounds.
    bounds: dict[FactorName, tuple[float, float]] = {}
    for name in weights:
        vals = [f.value for fs in factors_by_symbol.values()
                for f in fs if f.factor_name == name and f.value is not None]
        bounds[name] = _min_max(vals) if vals else (0.0, 1.0)

    scored: list[tuple[float, str, list[ScannerFactorValue]]] = []
    for symbol, fs in factors_by_symbol.items():
        raw_map = {f.factor_name: f.value for f in fs}
        composite = sum(
            w * _normalize_factor(name, raw_map.get(name), *bounds[name])
            for name, w in weights.items()
        )
        scored.append((round(composite, 6), symbol, fs))

    # Deterministic order: composite DESC, then symbol ASC (stable tie-break).
    scored.sort(key=lambda t: (-t[0], t[1]))
    logger.info("ranked %d symbols, weight_version=%d", len(scored), weight_version)

    return [
        ScannerRow(symbol=sym, rank=i + 1, composite_score=score, factors=fs)
        for i, (score, sym, fs) in enumerate(scored[:top_n])
    ]
