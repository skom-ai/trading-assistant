"""FR5 release gate — linter, traceability, disclaimers (STOCK-505/501/404).

File: app/guardrails/release_gate.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    The mandatory gate every AI-generated output passes before release:
    the ForbiddenLanguageLinter (blocks directive/guarantee/probability-of-
    profit language), the TraceabilityGate (every material claim must map
    to a cited, resolvable evidence id), and the DisclaimerService (server-
    authoritative disclaimer text per surface). No output leaves the
    service without passing through here.

Source: specs/arch/SDD.md §6, specs/arch/DDD.md §5.1, §4.4
"""
from __future__ import annotations

import logging

from app.core.errors import DomainError, ErrorCode

logger = logging.getLogger(__name__)

# Forbidden phrases: directive advice, guarantees, profit-probability.
_FORBIDDEN = [
    "you should buy", "you should sell", "you must buy", "guaranteed",
    "guarantee", "risk-free", "can't lose", "cannot lose", "sure thing",
    "will definitely", "probability of profit", "certain to rise",
]

# Server-authoritative disclaimers per surface (never hardcoded client-side).
_DISCLAIMERS = {
    "news": ("Educational decision-support only. Not investment advice. "
             "Verdicts summarize cited public news and may be incomplete."),
    "strategy": ("Educational decision-support only. Not investment advice, "
                 "not a recommendation to trade. Levels are hypothetical and "
                 "illustrative; assumptions and limitations apply (FINRA 2214)."),
    "analog": ("Illustrative historical precedent, not a backtest or guarantee. "
               "Past outcomes do not indicate future results."),
}


def lint_language(text: str) -> None:
    """Reject output containing forbidden directive/guarantee language.

    Args:
        text: The rationale/narrative about to be released.

    Raises:
        DomainError: UNSOURCED_CLAIM-adjacent block via ANALYSIS_UNAVAILABLE
            is not used here; a linter hit raises AGENT_OUTPUT_INVALID so the
            caller can regenerate or fail typed.
    """
    lowered = text.lower()
    for phrase in _FORBIDDEN:
        if phrase in lowered:
            logger.info("forbidden-language linter blocked phrase: %s", phrase)
            raise DomainError(
                ErrorCode.AGENT_OUTPUT_INVALID,
                "Output contained non-compliant language and was blocked.",
                {"phrase": phrase},
            )


def enforce_traceability(cited_ids: list[str], resolvable_ids: set[str]) -> None:
    """Ensure every cited evidence id resolves to a persisted row.

    Args:
        cited_ids: Evidence ids the output claims to rely on.
        resolvable_ids: Ids that actually exist in the evidence store.

    Raises:
        DomainError: UNSOURCED_CLAIM when a citation is missing/unresolvable.
    """
    unresolved = [cid for cid in cited_ids if cid not in resolvable_ids]
    if unresolved:
        logger.info("traceability gate blocked: unresolved=%s", unresolved)
        raise DomainError(
            ErrorCode.UNSOURCED_CLAIM,
            "A material claim was not backed by resolvable evidence.",
            {"unresolved_count": len(unresolved)},
        )


def disclaimer_for(surface: str) -> str:
    """Return the server-authoritative disclaimer for a surface.

    Args:
        surface: One of "news", "strategy", "analog".

    Returns:
        The disclaimer text (empty string for an unknown surface).
    """
    return _DISCLAIMERS.get(surface, "")
