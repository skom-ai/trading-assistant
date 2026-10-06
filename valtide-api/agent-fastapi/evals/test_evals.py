"""Behavioral eval suite (DeepEval, white-box, in-process).

File: evals/test_evals.py
Author: Sunil+Ai Assistant
Date: 2026-09-24
Description:
    The primary behavioral eval layer described in evals-testing-strategy.md
    §7.1. Runs the FR1 and FR3 LLM paths in-process through the SAME code the
    API uses (get_llm_adapter, NewsCheckService, StrategyService) so the eval
    exercises production behavior, then scores each output with the
    deterministic HARD-gate metrics (evals/metrics) plus optional LLM-as-judge
    metrics.

    Provider is chosen by VT_LLM_PROVIDER exactly as in production:
      - mock   (default) -> deterministic baseline; runs on every PR, free.
      - gemini/openrouter/... -> live judgment eval; runs nightly / on
        prompt/adapter/guardrail change (see README).

    DeepEval is optional. When installed, every case is also asserted via
    DeepEval's assert_test so results surface in DeepEval reports; when not,
    the deterministic checks still run as plain pytest asserts (the hard gates
    never silently skip).

    Run:
        VT_LLM_PROVIDER=mock   pytest evals/ -v        # baseline, every PR
        VT_LLM_PROVIDER=gemini pytest evals/ -v        # live, nightly
"""
from __future__ import annotations

import json
import os
from pathlib import Path

import pytest

from app.adapters.llm_adapter import get_llm_adapter
from app.core.config import get_settings
from app.domain.schemas import NewsVerdict, StrategyRecommendation
from app.repositories import reference_data
from app.services.scanner_service import ScannerService
from app.services.strategy_service import StrategyService

from evals.metrics import deterministic as det
from evals.metrics.deepeval_metrics import deterministic_metric, has_deepeval

_DATA = Path(__file__).parent / "datasets"


# --------------------------------------------------------------------------- #
# Dataset loading
# --------------------------------------------------------------------------- #
def _load(name: str) -> list[dict]:
    """Load a JSONL dataset into a list of records.

    Args:
        name: File name under evals/datasets/.

    Returns:
        The parsed records (empty list if the file is missing).
    """
    path = _DATA / name
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as fh:
        return [json.loads(line) for line in fh if line.strip()]


FR1_CASES = _load("fr1_news.jsonl")
FR3_CASES = _load("fr3_strategy.jsonl")
SYCO_PAIRS = _load("anti_sycophancy_pairs.jsonl")


@pytest.fixture(autouse=True, scope="session")
def _pin_provider() -> None:
    """Honor VT_LLM_PROVIDER; default to mock so a bare `pytest` is free."""
    os.environ.setdefault("VT_LLM_PROVIDER", "mock")
    os.environ.setdefault("VT_MARKET_DATA_MODE", "synthetic")
    os.environ.setdefault("VT_NEWS_MODE", "synthetic")
    get_settings.cache_clear()


# --------------------------------------------------------------------------- #
# Shared helpers
# --------------------------------------------------------------------------- #
def _assert_gate(passed: bool, reason: str, case_id: str, gate: str) -> None:
    """Assert a hard gate, optionally recording it in DeepEval.

    Args:
        passed: Whether the gate passed.
        reason: Human-readable detail.
        case_id: The eval case id (for the failure message).
        gate: The gate/metric name.
    """
    if has_deepeval():
        from deepeval import assert_test
        from deepeval.test_case import LLMTestCase

        tc = LLMTestCase(
            input=case_id, actual_output=reason,
            additional_metadata={"structured": {"_passed": passed}},
        )
        metric = deterministic_metric(gate, lambda s: (s["_passed"], reason))
        assert_test(tc, [metric])
    assert passed, f"[{gate}] {case_id}: {reason}"


def _fr1_output(case: dict) -> NewsVerdict:
    """Run the FR1 LLM path directly on the case's headlines.

    We call the adapter+parser rather than the HTTP endpoint because
    /news-check fetches its own headlines; the eval needs full control of
    the evidence to measure classification accuracy.

    Args:
        case: An FR1 dataset record.

    Returns:
        The parsed, schema-validated NewsVerdict.
    """
    from app.agents.structured_parser import parse_with_retries

    headlines = case["input"]["headlines"]
    verdict = parse_with_retries(
        get_llm_adapter(), "FR1_NEWS",
        f"Classify news for {case['input']['symbol']} using ONLY cited headlines.",
        {"headlines": headlines}, NewsVerdict,
    )
    return verdict


def _fr3_evidence(symbol: str, news_label: str) -> tuple[dict, float]:
    """Build the FR3 evidence block exactly as routes.py does.

    Args:
        symbol: The ticker.
        news_label: The FR1 label feeding the strategy.

    Returns:
        (evidence, last_price).
    """
    scan_row = ScannerService().run([symbol])["rows"][0]
    factors = scan_row["factors"]
    price = float(scan_row["last_price"] or 100.0)
    evidence = {
        "factors": factors,
        "last_price": scan_row["last_price"],
        "news_label": news_label,
        "evidence_ids": [f"{symbol}-f{k}" for k in factors],
        "catalyst": "EARNINGS_BEAT",
        "tags": ["momentum"] if (factors.get("MOMENTUM_3M") or 0) > 0 else ["weak_momentum"],
        "analog_factors": {
            "rsi14": factors.get("RSI_14"), "mom3m": factors.get("MOMENTUM_3M"),
            "mom6m": factors.get("MOMENTUM_6M"),
            "valuation_z": factors.get("VALUATION_ZSCORE"),
            "vol_ratio": factors.get("VOLUME_TREND"),
        },
    }
    return evidence, price


# --------------------------------------------------------------------------- #
# FR1 — News verdict evals
# --------------------------------------------------------------------------- #
@pytest.mark.skipif(not FR1_CASES, reason="fr1_news.jsonl not present")
@pytest.mark.parametrize("case", FR1_CASES, ids=[c["id"] for c in FR1_CASES])
def test_fr1_news(case: dict) -> None:
    """Assert FR1 classification, abstention, citation, and language gates."""
    expected = case["expected"]

    if expected.get("abstain"):
        # Abstention is enforced by the sufficiency gate (no LLM). Assert it
        # via the same short-circuit the service uses: empty headlines.
        from app.guardrails.validators import evaluate_sufficiency

        sufficient = evaluate_sufficiency(len(case["input"]["headlines"]), False)
        _assert_gate(not sufficient, "empty evidence must short-circuit to abstain",
                     case["id"], "abstention")
        return

    verdict = _fr1_output(case)
    out = verdict.model_dump(mode="json")

    ok, why = det.verdict_matches(out["label"], expected["label"])
    _assert_gate(ok, why, case["id"], "fr1_label_match")

    ok, why = det.committed_label_is_cited(out["label"], out["cited_headline_ids"])
    _assert_gate(ok, why, case["id"], "fr1_committed_label_cited")

    supplied = {h["id"] for h in case["input"]["headlines"]}
    ok, why = det.citations_resolvable(out["cited_headline_ids"], supplied)
    _assert_gate(ok, why, case["id"], "fr1_traceability")

    ok, why = det.no_forbidden_language(out["rationale"])
    _assert_gate(ok, why, case["id"], "fr1_forbidden_language")


# --------------------------------------------------------------------------- #
# FR3 — Strategy evals
# --------------------------------------------------------------------------- #
@pytest.mark.skipif(not FR3_CASES, reason="fr3_strategy.jsonl not present")
@pytest.mark.parametrize("case", FR3_CASES, ids=[c["id"] for c in FR3_CASES])
def test_fr3_strategy(case: dict) -> None:
    """Assert FR3 verdict, coherence, abstention, and language gates."""
    inp = case["input"]
    expected = case["expected"]
    svc = StrategyService()

    if inp.get("force_insufficient"):
        # Exercise the sufficiency short-circuit with an empty evidence block.
        result = svc.run(inp["symbol"], {"evidence_ids": [], "factors": {}},
                         reference_data.get_analog_cases(), inp.get("user_framing"))
    else:
        evidence, _price = _fr3_evidence(inp["symbol"], inp["news_label"])
        result = svc.run(inp["symbol"], evidence,
                         reference_data.get_analog_cases(), inp.get("user_framing"))

    strat = result["strategy"]
    price = float((strat.get("entry") or evidence.get("last_price")
                   if not inp.get("force_insufficient") else 100.0) or 100.0)

    ok, why = det.verdict_matches(strat["verdict"], expected["verdict"])
    _assert_gate(ok, why, case["id"], "fr3_verdict_match")

    # Coherence: BUY must have ordered, sanity-bounded levels; non-BUY none.
    ok, why = det.coherence_ok(strat, price)
    _assert_gate(ok, why, case["id"], "fr3_coherence")

    ok, why = det.abstention_correct(strat["verdict"], strat.get("entry"),
                                     strat.get("target"), strat.get("stop"))
    _assert_gate(ok, why, case["id"], "fr3_abstention")

    ok, why = det.no_forbidden_language(strat["rationale"])
    _assert_gate(ok, why, case["id"], "fr3_forbidden_language")


# --------------------------------------------------------------------------- #
# Anti-sycophancy — paired framing evals
# --------------------------------------------------------------------------- #
@pytest.mark.skipif(not SYCO_PAIRS, reason="anti_sycophancy_pairs.jsonl not present")
@pytest.mark.parametrize("pair", SYCO_PAIRS, ids=[p["id"] for p in SYCO_PAIRS])
def test_anti_sycophancy(pair: dict) -> None:
    """Same evidence + neutral vs hyped framing must yield identical output."""
    svc = StrategyService()
    evidence, _ = _fr3_evidence(pair["symbol"], pair["news_label"])

    neutral = svc.run(pair["symbol"], evidence, reference_data.get_analog_cases(),
                      pair["neutral_framing"])["strategy"]
    hyped = svc.run(pair["symbol"], evidence, reference_data.get_analog_cases(),
                    pair["hyped_framing"])["strategy"]

    keys = ["verdict", "entry", "target", "stop", "confidence"]
    ok, why = det.outputs_identical(neutral, hyped, keys)
    _assert_gate(ok, why, pair["id"], "anti_sycophancy_stability")

    # And neither framing may leak forbidden language.
    for label, strat in (("neutral", neutral), ("hyped", hyped)):
        ok, why = det.no_forbidden_language(strat["rationale"])
        _assert_gate(ok, f"{label}: {why}", pair["id"], "anti_sycophancy_language")
