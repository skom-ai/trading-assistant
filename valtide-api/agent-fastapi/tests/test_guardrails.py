"""Unit tests for the FR5 guardrail modules.

File: tests/test_guardrails.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Covers the sufficiency rule (absence vs contradiction), framing
    neutralization, numeric coherence (BUY ordering + sanity bounds),
    the forbidden-language linter, and the traceability gate
    (DDD §1.3, §3.2, §3.5, §5.1-5.2).
"""
from __future__ import annotations

import pytest

from app.core.errors import DomainError, ErrorCode
from app.domain.enums import ConfidenceLevel, StrategyVerdict
from app.domain.schemas import StrategyRecommendation
from app.guardrails import release_gate, validators


def test_sufficiency_absence_is_insufficient() -> None:
    """No evidence and no market data => insufficient."""
    assert validators.evaluate_sufficiency(0, has_market_data=False) is False


def test_sufficiency_present_evidence_is_sufficient() -> None:
    """Any present evidence (even if conflicting) => sufficient."""
    assert validators.evaluate_sufficiency(2, has_market_data=False) is True


def test_framing_neutralizer_strips_persuasion() -> None:
    """Persuasive phrasing is removed from user framing."""
    out = validators.neutralize_framing("This is a great buy, right?")
    assert "great buy" not in out.lower() and "right?" not in out.lower()


def _buy(entry: float, target: float, stop: float) -> StrategyRecommendation:
    """Build a BUY recommendation fixture."""
    return StrategyRecommendation(
        verdict=StrategyVerdict.BUY, entry=entry, target=target, stop=stop,
        confidence=ConfidenceLevel.MEDIUM, rationale="r")


def test_coherence_accepts_valid_buy() -> None:
    """A well-ordered BUY within sanity bounds passes."""
    assert validators.validate_coherence(_buy(100, 110, 95), recent_price=100) is True


def test_coherence_rejects_bad_ordering() -> None:
    """A BUY with stop above entry fails."""
    assert validators.validate_coherence(_buy(100, 110, 105), recent_price=100) is False


def test_linter_blocks_directive_language() -> None:
    """Directive/guarantee language is blocked as a typed failure."""
    with pytest.raises(DomainError) as exc:
        release_gate.lint_language("You should buy this now, it is guaranteed.")
    assert exc.value.code == ErrorCode.AGENT_OUTPUT_INVALID


def test_traceability_blocks_unresolved_citation() -> None:
    """An unresolvable citation id blocks release."""
    with pytest.raises(DomainError) as exc:
        release_gate.enforce_traceability(["missing-id"], resolvable_ids={"real-id"})
    assert exc.value.code == ErrorCode.UNSOURCED_CLAIM


def test_disclaimer_present_for_each_surface() -> None:
    """Every AI surface has a non-empty server-authoritative disclaimer."""
    for surface in ("news", "strategy", "analog"):
        assert release_gate.disclaimer_for(surface)
