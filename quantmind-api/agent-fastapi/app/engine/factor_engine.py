"""Deterministic factor computation (FR2 / STOCK-202).

File: app/engine/factor_engine.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Pure, side-effect-free computation of the four scanner factors from
    normalized market data. NO LLM, no network. Every formula matches the
    DDD §2.2 table exactly, with the documented edge-case rules
    (excluded z-score for negative earnings, guarded volume denominator,
    insufficient-history momentum).

Source: specs/arch/DDD.md §2.2
"""
from __future__ import annotations

import logging
from statistics import mean, pstdev

from app.domain.enums import FactorName, MarketData
from app.domain.schemas import ScannerFactorValue

logger = logging.getLogger(__name__)

# Trading-day lookbacks (approximate calendar windows).
_DAYS_3M = 63
_DAYS_6M = 126
_RSI_PERIOD = 14
_VOL_SHORT = 20
_VOL_LONG = 63


def compute_rsi14(prices: list[float]) -> float | None:
    """Compute Wilder's 14-period RSI on daily closes.

    Args:
        prices: Daily close prices, oldest-first.

    Returns:
        RSI in [0, 100], or None if there is insufficient history.
    """
    if len(prices) < _RSI_PERIOD + 1:
        return None
    gains, losses = [], []
    for prev, cur in zip(prices[-(_RSI_PERIOD + 1):-1], prices[-_RSI_PERIOD:]):
        change = cur - prev
        gains.append(max(change, 0.0))
        losses.append(max(-change, 0.0))
    avg_gain = mean(gains)
    avg_loss = mean(losses)
    if avg_loss == 0:
        return 100.0
    rs = avg_gain / avg_loss
    return round(100.0 - (100.0 / (1.0 + rs)), 6)


def compute_return(prices: list[float], lookback: int) -> float | None:
    """Compute a simple lookback return.

    Args:
        prices: Daily close prices, oldest-first.
        lookback: Number of trading days to look back.

    Returns:
        (price_t / price_{t-lookback}) - 1, or None if history is short
        or the historical price is non-positive (guards divide-by-zero).
    """
    if len(prices) <= lookback:
        return None
    base = prices[-(lookback + 1)]
    if base <= 0:
        return None
    return round((prices[-1] / base) - 1.0, 6)


def compute_volume_trend(volumes: list[float]) -> float | None:
    """Compute the 20D/3M average-volume ratio.

    Args:
        volumes: Daily volumes, oldest-first.

    Returns:
        avg_vol_20D / avg_vol_3M, or None when the denominator is
        zero/near-zero or history is insufficient (no NaN propagation).
    """
    if len(volumes) < _VOL_LONG:
        return None
    short = mean(volumes[-_VOL_SHORT:])
    long = mean(volumes[-_VOL_LONG:])
    if long <= 1e-9:
        return None
    return round(short / long, 6)


def compute_valuation_zscore(pe: float | None, universe_pes: list[float]) -> float | None:
    """Compute the universe-relative P/E z-score.

    Args:
        pe: The ticker's trailing P/E (None => excluded from population).
        universe_pes: P/E values of tickers with valid positive earnings.

    Returns:
        (pe - mean) / stdev, or None if pe is invalid or the universe
        spread is degenerate.
    """
    if pe is None or pe <= 0 or len(universe_pes) < 2:
        return None
    mu = mean(universe_pes)
    sigma = pstdev(universe_pes)
    if sigma <= 1e-9:
        return None
    return round((pe - mu) / sigma, 6)


def compute_factors(data: MarketData, universe_pes: list[float]) -> list[ScannerFactorValue]:
    """Compute all four factors for one ticker.

    Args:
        data: Normalized market data for the ticker.
        universe_pes: Valid positive P/Es across the universe snapshot.

    Returns:
        A ScannerFactorValue per FactorName; value is None when excluded.
    """
    prov = data.provenance
    values = {
        FactorName.RSI_14: compute_rsi14(data.prices),
        FactorName.MOMENTUM_3M: compute_return(data.prices, _DAYS_3M),
        FactorName.MOMENTUM_6M: compute_return(data.prices, _DAYS_6M),
        FactorName.VOLUME_TREND: compute_volume_trend(data.volumes),
        FactorName.VALUATION_ZSCORE: compute_valuation_zscore(data.pe_ratio, universe_pes),
    }
    logger.debug("computed factors for %s: %s", data.symbol, values)
    return [ScannerFactorValue(factor_name=n, value=v, data_provenance=prov)
            for n, v in values.items()]
