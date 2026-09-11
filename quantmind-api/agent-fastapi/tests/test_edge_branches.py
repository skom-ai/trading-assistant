"""Edge-branch tests to complete coverage of the release/error paths.

File: tests/test_edge_branches.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Covers the FastAPI DomainError -> sanitized envelope handler, the
    coherence sanity-bound rejection, and the mock strategy AVOID branch.
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.adapters.llm_adapter import MockLLMAdapter
from app.domain.enums import ConfidenceLevel, StrategyVerdict
from app.domain.schemas import StrategyRecommendation
from app.guardrails import validators
from app.main import create_app

client = TestClient(create_app())


def test_domain_error_envelope_via_bad_agent_output(monkeypatch) -> None:
    """A forced UNSOURCED_CLAIM surfaces the sanitized error envelope."""
    from app.services import news_service

    def _boom(*_args, **_kwargs):
        from app.core.errors import DomainError, ErrorCode

        raise DomainError(ErrorCode.UNSOURCED_CLAIM, "blocked")

    monkeypatch.setattr(news_service.release_gate, "enforce_traceability", _boom)
    r = client.post("/internal/v1/news-check", json={"symbol": "NVDA"})
    body = r.json()
    assert body["code"] == "UNSOURCED_CLAIM"
    assert "correlation_id" in body


def test_coherence_rejects_absurd_target() -> None:
    """A target far above recent price fails the sanity bound."""
    rec = StrategyRecommendation(
        verdict=StrategyVerdict.BUY, entry=100, target=100000, stop=95,
        confidence=ConfidenceLevel.LOW, rationale="r")
    assert validators.validate_coherence(rec, recent_price=100) is False


def test_mock_strategy_avoid_on_negative_momentum() -> None:
    """Strong negative momentum drives the mock to AVOID with null levels."""
    out = MockLLMAdapter("m").complete_json(
        "FR3_STRATEGY", "p",
        {"analog_factors": {"mom3m": -0.5}, "news_label": "ALREADY_PRICED_IN",
         "last_price": 100.0, "evidence_ids": ["e1"]})
    assert out["verdict"] == "AVOID" and out["entry"] is None
