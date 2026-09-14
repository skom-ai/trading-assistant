"""FR5 pre/post reasoning guardrails (STOCK-502/503/303).

File: app/guardrails/validators.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Three deterministic guardrail units consumed identically by FR1 and
    FR3: the shared SufficiencyEvaluator ("absence is insufficient;
    contradiction within present evidence is not"), the FramingNeutralizer
    (anti-sycophancy input scrub), and the CoherenceValidator (post-LLM
    numeric check for long BUY plans). None call an LLM.

Source: specs/arch/DDD.md §1.3, §3.2, §3.5, §5.2
"""
from __future__ import annotations

import logging
import re

from app.domain.enums import StrategyVerdict
from app.domain.schemas import StrategyRecommendation

logger = logging.getLogger(__name__)

# Sanity multipliers guarding against absurd LLM levels vs recent price.
_SANITY_MAX = 3.0   # target must not exceed 3x recent price
_SANITY_MIN = 0.2   # stop must not fall below 0.2x recent price

# Leading/persuasive phrases stripped before evidence reaches the prompt.
_FRAMING_PATTERNS = [
    r"\b(great|amazing|obvious|sure|guaranteed)\s+(buy|winner|pick)\b",
    r",?\s*right\s*\?", r"\bshould i (buy|jump in)\b", r"\bcan'?t lose\b",
    r"\bto the moon\b", r"\beveryone (says|knows)\b",
]


def evaluate_sufficiency(evidence_count: int, has_market_data: bool) -> bool:
    """Decide whether evidence is sufficient to produce a committed verdict.

    The governing rule (stated once, used everywhere): ABSENCE of evidence
    is insufficient; contradiction WITHIN present evidence is not.

    Args:
        evidence_count: Number of credible evidence items (headlines/factors).
        has_market_data: Whether resolvable market data was obtained.

    Returns:
        True if sufficient to proceed; False to short-circuit to
        INSUFFICIENT_EVIDENCE (no LLM call).
    """
    sufficient = evidence_count > 0 or has_market_data
    if not sufficient:
        logger.info("sufficiency: INSUFFICIENT (no evidence present)")
    return sufficient


def neutralize_framing(user_text: str | None) -> str:
    """Strip leading/persuasive phrasing from free-text user framing.

    Args:
        user_text: Optional user-supplied framing (may be None/empty).

    Returns:
        The neutralized text (empty string when nothing was supplied).
    """
    if not user_text:
        return ""
    cleaned = user_text
    for pat in _FRAMING_PATTERNS:
        cleaned = re.sub(pat, "", cleaned, flags=re.IGNORECASE)
    cleaned = re.sub(r"\s+", " ", cleaned).strip()
    if cleaned != user_text:
        logger.debug("framing neutralized")
    return cleaned


def validate_coherence(rec: StrategyRecommendation, recent_price: float) -> bool:
    """Validate numeric coherence of a strategy recommendation.

    For a long BUY: stop < entry < target and levels within sanity bounds.
    For WAIT/AVOID/INSUFFICIENT_EVIDENCE: numeric checks are skipped and
    applicability flags must mark levels non-actionable.

    Args:
        rec: The parsed strategy recommendation.
        recent_price: The most recent price for sanity bounding.

    Returns:
        True if coherent; False if the plan must be regenerated/failed.
    """
    if rec.verdict != StrategyVerdict.BUY:
        # Non-BUY must not present actionable levels.
        return all(v is None for v in (rec.entry, rec.target, rec.stop))
    if rec.entry is None or rec.target is None or rec.stop is None:
        return False
    if not (rec.stop < rec.entry < rec.target):
        logger.info("coherence fail: ordering stop<entry<target violated")
        return False
    if rec.target > recent_price * _SANITY_MAX or rec.stop < recent_price * _SANITY_MIN:
        logger.info("coherence fail: level outside sanity bounds")
        return False
    return True
