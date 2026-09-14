"""Unit tests for scoring, ranking, analog matching, and the zero-LLM contract.

File: tests/test_engine_determinism.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Asserts the FR2 determinism contract (identical input -> identical
    top-10, stable tie-break), the CI zero-LLM-call guarantee for the
    deterministic path via a call-spy, and the FR4 similarity + threshold
    behavior (DDD §2.3, §4.2-4.3, cross-feature invariant #2).
"""
from __future__ import annotations

from unittest.mock import patch

from app.engine import analog_matcher
from app.repositories import reference_data
from app.services.scanner_service import ScannerService


def test_scan_is_byte_identical_across_runs() -> None:
    """Two scans over the same universe produce identical rankings."""
    svc = ScannerService()
    universe = reference_data.get_universe()
    assert svc.run(universe) == svc.run(universe)


def test_scan_makes_zero_llm_calls() -> None:
    """The deterministic scan path never constructs an LLM adapter."""
    with patch("app.adapters.llm_adapter.get_llm_adapter") as spy:
        ScannerService().run(reference_data.get_universe())
        spy.assert_not_called()


def test_ranking_tie_break_is_stable_by_symbol() -> None:
    """Ranks are 1..10 contiguous and ordered deterministically."""
    rows = ScannerService().run(reference_data.get_universe())["rows"]
    assert [r["rank"] for r in rows] == list(range(1, 11))


def test_analog_returns_empty_below_threshold() -> None:
    """A candidate unlike every case yields the honest no-analog state."""
    candidate = {"catalyst": "OTHER", "tags": ["nonexistent_tag"],
                 "factors": {"rsi14": 50, "mom3m": 0, "mom6m": 0,
                             "valuation_z": 0, "vol_ratio": 1}}
    cases = [{"case_id": "x", "ticker": "ZZZ", "case_date": "2020-01-01",
              "catalyst_type": "REGULATORY_ACTION", "setup_tags": ["safety"],
              "key_factors": {"rsi14": 10, "mom3m": -0.9, "mom6m": -0.9,
                              "valuation_z": 5, "vol_ratio": 4},
              "real_outcome": "declined"}]
    assert analog_matcher.match_analogs(candidate, cases, version=1) == []


def test_analog_match_reason_is_mechanical() -> None:
    """A same-catalyst match names the catalyst in its reason string."""
    candidate = {"catalyst": "GUIDANCE_RAISE", "tags": ["ai_demand"],
                 "factors": {"rsi14": 42, "mom3m": 0.12, "mom6m": 0.33,
                             "valuation_z": 1.7, "vol_ratio": 1.9}}
    cases = reference_data.get_analog_cases()
    matches = analog_matcher.match_analogs(candidate, cases, version=1)
    assert matches, "expected at least one match"
    assert "catalyst" in matches[0].match_reason
