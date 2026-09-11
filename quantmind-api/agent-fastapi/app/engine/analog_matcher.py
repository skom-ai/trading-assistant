"""Deterministic historical-analog similarity (FR4 / STOCK-402).

File: app/engine/analog_matcher.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Computes similarity between a candidate setup and each curated case
    using versioned tag-overlap (Jaccard) + normalized factor distance,
    selects the top 2-3 above a minimum threshold, and derives the
    match-reason MECHANICALLY from the dimensions that actually matched.
    NO LLM, no vector embeddings, no network — same reproducibility
    guarantee as the scanner.

Source: specs/arch/DDD.md §4.2-4.3
"""
from __future__ import annotations

import logging
import math

from app.domain.schemas import AnalogMatch

logger = logging.getLogger(__name__)

# Versioned config: weights, factor normalization spans, min threshold.
SIMILARITY_CONFIG: dict[int, dict[str, float]] = {
    1: {"w_tag": 0.5, "w_factor": 0.5, "min_threshold": 0.35},
}
# Per-factor normalization spans used to scale the Euclidean distance.
_FACTOR_SPANS = {"rsi14": 100.0, "mom3m": 1.0, "mom6m": 1.0,
                 "valuation_z": 6.0, "vol_ratio": 4.0}


def _jaccard(a: set[str], b: set[str]) -> float:
    """Return the Jaccard index of two tag sets."""
    if not a and not b:
        return 0.0
    return len(a & b) / len(a | b)


def _normalized_factor_distance(cand: dict, case: dict) -> float:
    """Return a normalized Euclidean distance in [0, 1] over shared factors.

    Args:
        cand: Candidate factor snapshot.
        case: Historical case factor snapshot.

    Returns:
        Distance in [0, 1]; 0 = identical, 1 = maximally distant.
    """
    keys = [k for k in _FACTOR_SPANS
            if cand.get(k) is not None and case.get(k) is not None]
    if not keys:
        return 1.0
    acc = 0.0
    for k in keys:
        span = _FACTOR_SPANS[k]
        acc += ((float(cand[k]) - float(case[k])) / span) ** 2
    return min(1.0, math.sqrt(acc / len(keys)))


def _match_reason(cand_tags: set[str], case_tags: set[str],
                  cand_catalyst: str, case_catalyst: str) -> str:
    """Build a truthful, mechanical match-reason string.

    Args:
        cand_tags: Candidate setup tags.
        case_tags: Case setup tags.
        cand_catalyst: Candidate catalyst type.
        case_catalyst: Case catalyst type.

    Returns:
        A reason naming only the dimensions that actually matched.
    """
    parts: list[str] = []
    if cand_catalyst == case_catalyst:
        parts.append(f"same catalyst: {case_catalyst.lower().replace('_', ' ')}")
    shared = cand_tags & case_tags
    if shared:
        parts.append("similar setup: " + ", ".join(sorted(t.replace("_", " ") for t in shared)))
    return "; ".join(parts) if parts else "closest available factor profile"


def match_analogs(candidate: dict, cases: list[dict], version: int,
                  top_n: int = 3) -> list[AnalogMatch]:
    """Rank curated cases against a candidate and select the top matches.

    Args:
        candidate: {"catalyst": str, "tags": list[str], "factors": dict}.
        cases: Curated cases with the same shape plus outcome fields.
        version: Which versioned similarity config to use.
        top_n: Maximum matches to return (2-3 typical).

    Returns:
        AnalogMatch list above threshold, rank 1..N; empty when none
        clear the minimum-similarity threshold ("no strong analog").
    """
    cfg = SIMILARITY_CONFIG[version]
    cand_tags = set(candidate.get("tags", [])) | {candidate["catalyst"]}
    cand_factors = candidate.get("factors", {})

    scored: list[tuple[float, dict]] = []
    for case in cases:
        case_tags = set(case.get("setup_tags", [])) | {case["catalyst_type"]}
        tag_sim = _jaccard(cand_tags, case_tags)
        factor_sim = 1.0 - _normalized_factor_distance(cand_factors, case.get("key_factors", {}))
        sim = cfg["w_tag"] * tag_sim + cfg["w_factor"] * factor_sim
        scored.append((round(sim, 5), case))

    # Threshold + deterministic order (similarity DESC, case_id ASC tie-break).
    scored = [s for s in scored if s[0] >= cfg["min_threshold"]]
    scored.sort(key=lambda t: (-t[0], str(t[1].get("case_id", ""))))
    if not scored:
        logger.info("no analog cleared threshold %.2f", cfg["min_threshold"])
        return []

    out: list[AnalogMatch] = []
    for i, (sim, case) in enumerate(scored[:top_n]):
        out.append(AnalogMatch(
            case_ticker=case["ticker"], case_date=str(case["case_date"]),
            catalyst_type=case["catalyst_type"], similarity_score=sim,
            match_reason=_match_reason(
                set(candidate.get("tags", [])), set(case.get("setup_tags", [])),
                candidate["catalyst"], case["catalyst_type"]),
            real_outcome=case["real_outcome"], rank=i + 1))
    return out
