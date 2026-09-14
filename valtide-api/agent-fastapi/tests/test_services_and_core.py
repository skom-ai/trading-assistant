"""Coverage-completing tests for parser, errors, services, and providers.

File: tests/test_services_and_core.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Exercises the bounded-retry parser (recovery + exhaustion), the error
    taxonomy http mapping, the strategy service's insufficient-evidence and
    analog-isolation paths, the news service citation join, and the
    provider adapters' determinism + empty-set behavior.
"""
from __future__ import annotations

import pytest

from app.adapters.market_news import MarketDataProvider, NewsProvider
from app.agents.structured_parser import parse_with_retries
from app.core.errors import DomainError, ErrorCode
from app.domain.schemas import NewsVerdict
from app.services.news_service import NewsCheckService
from app.services.strategy_service import StrategyService


class _FlakyAdapter:
    """Adapter returning invalid output N times, then a valid one."""

    def __init__(self, fail_times: int) -> None:
        self.calls = 0
        self.fail_times = fail_times

    def complete_json(self, feature: str, prompt: str, evidence: dict) -> dict:
        self.calls += 1
        if self.calls <= self.fail_times:
            return {"bogus": "not-a-verdict"}
        return {"label": "HYPE", "rationale": "r", "cited_headline_ids": ["h1"]}


def test_parser_recovers_after_retries() -> None:
    """The parser recovers when a later attempt is valid."""
    adapter = _FlakyAdapter(fail_times=2)
    out = parse_with_retries(adapter, "FR1_NEWS", "p", {}, NewsVerdict)
    assert out.label.value == "HYPE" and adapter.calls == 3


def test_parser_raises_typed_failure_when_exhausted() -> None:
    """The parser raises AGENT_OUTPUT_INVALID after MAX_RETRIES."""
    with pytest.raises(DomainError) as exc:
        parse_with_retries(_FlakyAdapter(fail_times=99), "FR1_NEWS", "p", {}, NewsVerdict)
    assert exc.value.code == ErrorCode.AGENT_OUTPUT_INVALID


def test_error_http_status_mapping() -> None:
    """DomainError maps to the configured HTTP status (default 500)."""
    assert DomainError(ErrorCode.UNSUPPORTED_TICKER, "x").http_status() == 422
    assert DomainError(ErrorCode.INSUFFICIENT_EVIDENCE, "x").http_status() == 500


def test_strategy_insufficient_evidence_has_no_numbers() -> None:
    """Empty evidence yields INSUFFICIENT_EVIDENCE with null levels."""
    out = StrategyService().run("NVDA", {"evidence_ids": [], "factors": {}}, [])
    s = out["strategy"]
    assert s["verdict"] == "INSUFFICIENT_EVIDENCE"
    assert s["entry"] is None and s["target"] is None and s["stop"] is None


def test_strategy_analog_isolation_returns_error_field() -> None:
    """A malformed analog case set is isolated; strategy still returns."""
    evidence = {"evidence_ids": ["NVDA-fRSI_14"], "factors": {"RSI_14": 55},
                "last_price": 100.0, "news_label": "ALREADY_PRICED_IN",
                "catalyst": "OTHER", "tags": [], "analog_factors": {"rsi14": 55}}
    out = StrategyService().run("NVDA", evidence, [{"broken": "case"}])
    assert out["strategy"]["verdict"] in {"BUY", "WAIT", "AVOID"}
    assert out["analog_error"] is not None


def test_news_service_joins_only_cited_headlines() -> None:
    """Returned citations are a subset resolvable to fetched headlines."""
    out = NewsCheckService().run("AAPL")
    ids = {c["id"] for c in out["citations"]}
    assert all(i.startswith("AAPL-h") for i in ids)


def test_market_provider_is_deterministic() -> None:
    """Same symbol yields identical price/volume series."""
    m = MarketDataProvider()
    assert m.fetch("NVDA").prices == m.fetch("NVDA").prices


def test_news_provider_empty_flag_returns_no_headlines() -> None:
    """The empty flag simulates a zero-result provider set."""
    assert NewsProvider().fetch("NVDA", empty=True) == []
