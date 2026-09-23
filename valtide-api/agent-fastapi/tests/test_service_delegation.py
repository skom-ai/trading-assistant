"""Service-level framework-delegation + native-branch tests (Phase 9).

File: tests/test_service_delegation.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    Closes coverage on the two service delegation branches added by the
    migration: NewsCheckService.run and StrategyService.run route to the
    LangGraph flows when VT_LLM_FRAMEWORK=langchain, and to the native
    orchestration otherwise. Also covers the native StrategyService
    coherence regenerate-or-fail terminal raise. Uses the deterministic
    mock adapter, so live and native paths agree by construction.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.core.config import Settings, get_settings
from app.core.errors import DomainError, ErrorCode
from app.repositories import reference_data
from app.services.news_service import NewsCheckService
from app.services.strategy_service import StrategyService


def _langchain_settings() -> Settings:
    """Settings with framework=langchain but provider=mock (deterministic)."""
    return Settings(llm_provider="mock", llm_framework="langchain")


def test_news_service_delegates_to_graph_when_langchain() -> None:
    """NewsCheckService.run routes to the FR1 graph under framework=langchain."""
    # news_service imports get_settings inside the method, so patch the source.
    with patch("app.core.config.get_settings", _langchain_settings):
        out = NewsCheckService().run("NVDA")
    assert out["label"] in {"REAL_CATALYST", "ALREADY_PRICED_IN", "HYPE"}
    assert out["disclaimer"]


def test_strategy_service_delegates_to_graph_when_langchain() -> None:
    """StrategyService.run routes to the FR3 graph under framework=langchain."""
    cases = reference_data.get_analog_cases()
    factors = {"RSI_14": 55.0, "MOMENTUM_3M": 0.25, "MOMENTUM_6M": 0.30,
               "VALUATION_ZSCORE": -0.5, "VOLUME_TREND": 1.2}
    evidence = {
        "factors": factors, "last_price": 100.0, "news_label": "REAL_CATALYST",
        "evidence_ids": [f"NVDA-f{k}" for k in factors], "catalyst": "EARNINGS_BEAT",
        "tags": ["momentum"], "analog_factors": {"mom3m": 0.25},
    }
    with patch("app.services.strategy_service.get_settings", _langchain_settings):
        out = StrategyService().run("NVDA", evidence, cases)
    assert out["strategy"]["verdict"] == "BUY"
    assert out["disclaimer"] and out["analog_disclaimer"]


def test_native_strategy_incoherent_raises() -> None:
    """Native _run_native path raises AGENT_OUTPUT_INVALID on incoherent BUY."""
    cases = reference_data.get_analog_cases()
    factors = {"RSI_14": 55.0, "MOMENTUM_3M": 0.25}
    evidence = {"factors": factors, "last_price": 100.0, "news_label": "REAL_CATALYST",
                "evidence_ids": ["NVDA-fRSI_14"], "catalyst": "EARNINGS_BEAT",
                "tags": ["momentum"], "analog_factors": {"mom3m": 0.25}}
    bad = {"verdict": "BUY", "entry": 100.0, "target": 90.0, "stop": 110.0,
           "holding_horizon": "1-3 months", "confidence": "MEDIUM",
           "rationale": "x", "cited_evidence_ids": ["NVDA-fRSI_14"],
           "applicability_flags": {}}
    adapter = MagicMock()
    adapter.complete_json.return_value = bad
    with patch("app.services.strategy_service.get_llm_adapter", return_value=adapter):
        with pytest.raises(DomainError) as gi:
            StrategyService()._run_native("NVDA", evidence, cases)
    assert gi.value.code == ErrorCode.AGENT_OUTPUT_INVALID


def teardown_module(_module) -> None:
    """Clear the settings cache so patched settings never leak."""
    get_settings.cache_clear()
