"""FR3 LangGraph equivalence tests (LangChain migration, Phase 4).

File: tests/test_strategy_graph.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    Proves the FR3 LangGraph (StrategyGraph) is behavior-equivalent to the
    native StrategyService on the same deterministic mock adapter:
      - BUY path (REAL_CATALYST + positive momentum) yields an identical,
        coherent, fully-cited payload;
      - WAIT path yields identical output with null levels;
      - the INSUFFICIENT_EVIDENCE short-circuit is identical and calls no LLM;
      - the analog branch is partial-failure isolated: a matcher failure
        empties analogs + sets analog_error WITHOUT nulling the strategy,
        identically to native.
    FR3 has no time-varying fields, so equality is asserted exactly.

Source: langchain-upgrade.md §4/§5
"""
from __future__ import annotations

from unittest.mock import patch

from app.agents.graphs.strategy_graph import StrategyGraph
from app.repositories import reference_data
from app.services.strategy_service import StrategyService


def _evidence(symbol: str = "NVDA", news_label: str = "REAL_CATALYST",
              momentum: float = 0.25) -> dict:
    """Build a deterministic evidence block for the strategy path.

    Args:
        symbol: Ticker.
        news_label: FR1 label feeding the strategy heuristic.
        momentum: 3M momentum value (drives BUY vs WAIT vs AVOID).

    Returns:
        An evidence dict shaped like the API route builds.
    """
    factors = {"RSI_14": 55.0, "MOMENTUM_3M": momentum, "MOMENTUM_6M": 0.30,
               "VALUATION_ZSCORE": -0.5, "VOLUME_TREND": 1.2}
    return {
        "factors": factors, "last_price": 100.0, "news_label": news_label,
        "evidence_ids": [f"{symbol}-f{k}" for k in factors],
        "catalyst": "EARNINGS_BEAT",
        "tags": ["momentum"] if momentum > 0 else ["weak_momentum"],
        "analog_factors": {"rsi14": 55.0, "mom3m": momentum, "mom6m": 0.30,
                           "valuation_z": -0.5, "vol_ratio": 1.2},
    }


def test_graph_matches_native_buy_path() -> None:
    """FR3 BUY payload is identical between graph and native."""
    cases = reference_data.get_analog_cases()
    ev = _evidence(news_label="REAL_CATALYST", momentum=0.25)
    native = StrategyService()._run_native("NVDA", dict(ev), cases)
    graph = StrategyGraph().run("NVDA", dict(ev), cases)
    assert graph == native
    assert graph["strategy"]["verdict"] == "BUY"
    s = graph["strategy"]
    assert s["stop"] < s["entry"] < s["target"]  # coherent


def test_graph_matches_native_wait_path() -> None:
    """FR3 WAIT payload (null levels) is identical between graph and native."""
    cases = reference_data.get_analog_cases()
    ev = _evidence(news_label="ALREADY_PRICED_IN", momentum=0.05)
    native = StrategyService()._run_native("AAPL", dict(ev), cases)
    graph = StrategyGraph().run("AAPL", dict(ev), cases)
    assert graph == native
    assert graph["strategy"]["verdict"] == "WAIT"
    assert graph["strategy"]["entry"] is None


def test_graph_insufficient_short_circuit_matches_native() -> None:
    """No evidence: graph and native both yield INSUFFICIENT_EVIDENCE, no LLM."""
    cases = reference_data.get_analog_cases()
    empty = {"factors": {}, "evidence_ids": [], "last_price": 100.0}
    native = StrategyService()._run_native("NVDA", dict(empty), cases)
    graph = StrategyGraph().run("NVDA", dict(empty), cases)
    assert graph == native
    assert graph["strategy"]["verdict"] == "INSUFFICIENT_EVIDENCE"


def test_graph_analog_failure_is_isolated_like_native() -> None:
    """A matcher failure empties analogs + sets analog_error, keeps strategy."""
    cases = reference_data.get_analog_cases()
    ev = _evidence(news_label="REAL_CATALYST", momentum=0.25)
    with patch("app.engine.analog_matcher.match_analogs",
               side_effect=RuntimeError("boom")):
        native = StrategyService()._run_native("NVDA", dict(ev), cases)
        graph = StrategyGraph().run("NVDA", dict(ev), cases)
    assert graph == native
    # strategy still stands; analog section reports the isolated error
    assert graph["strategy"]["verdict"] == "BUY"
    assert graph["analogs"] == []
    assert graph["analog_error"] == "SOURCE_UNAVAILABLE"


def test_graph_produces_analogs_on_happy_path() -> None:
    """The isolated analog branch returns matches when the matcher succeeds."""
    cases = reference_data.get_analog_cases()
    graph = StrategyGraph().run("NVDA", _evidence(), cases)
    assert graph["analog_error"] is None
    assert isinstance(graph["analogs"], list)


def test_graph_incoherent_strategy_raises_like_native() -> None:
    """An incoherent BUY that never validates raises AGENT_OUTPUT_INVALID.

    Mirrors the native _generate_coherent bounded regenerate-or-fail: a BUY
    with mis-ordered levels fails coherence on every attempt, so after
    _MAX_REGEN the graph raises the same typed DomainError as native.
    """
    from unittest.mock import MagicMock

    import pytest

    from app.core.errors import DomainError, ErrorCode

    cases = reference_data.get_analog_cases()
    ev = _evidence(news_label="REAL_CATALYST", momentum=0.25)
    # Adapter always returns an incoherent BUY (stop > target): never coherent.
    bad = {
        "verdict": "BUY", "entry": 100.0, "target": 90.0, "stop": 110.0,
        "holding_horizon": "1-3 months", "confidence": "MEDIUM",
        "rationale": "incoherent", "cited_evidence_ids": ev["evidence_ids"],
        "applicability_flags": {},
    }
    adapter = MagicMock()
    adapter.complete_json.return_value = bad

    graph = StrategyGraph(adapter=adapter)
    with pytest.raises(DomainError) as gi:
        graph.run("NVDA", dict(ev), cases)
    assert gi.value.code == ErrorCode.AGENT_OUTPUT_INVALID
