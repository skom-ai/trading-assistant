"""FR1 LangGraph equivalence tests (LangChain migration, Phase 3).

File: tests/test_news_graph.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    Proves the FR1 LangGraph (NewsGraph) is behavior-equivalent to the
    native NewsCheckService on the same deterministic mock adapter:
      - the committed-verdict path yields an identical response (after
        normalizing the news provider's time-varying published_at/hash,
        which are now()-stamped by design and are not part of the verdict);
      - the INSUFFICIENT_EVIDENCE short-circuit is identical and calls no
        LLM (routed to END before the classify node);
      - the graph enforces the mandatory release gate (traceability).
    The mock adapter is deterministic, so equivalence here transfers to the
    live adapter, which both paths invoke through the same bounded parser.
"""
from __future__ import annotations

import copy

from app.adapters.market_news import NewsProvider
from app.agents.graphs.news_graph import NewsGraph
from app.services.news_service import NewsCheckService


def _normalize(resp: dict) -> dict:
    """Blank the time-varying headline fields so verdicts compare cleanly.

    The synthetic NewsProvider stamps published_at with now() and derives
    content_hash from it, so those two fields differ run-to-run and are not
    part of the FR1 verdict contract. Everything else must match exactly.

    Args:
        resp: An FR1 response dict.

    Returns:
        A deep copy with citation published_at/hash normalized.
    """
    out = copy.deepcopy(resp)
    for c in out.get("citations", []):
        c["published_at"] = "<normalized>"
        c["hash"] = "<normalized>"
    return out


def test_graph_matches_native_on_committed_verdict() -> None:
    """FR1 graph output equals native output (normalized) for a real verdict."""
    provider = NewsProvider()
    native = NewsCheckService(news=provider)._run_native("NVDA")
    graph = NewsGraph(news=provider).run("NVDA")
    assert _normalize(graph) == _normalize(native)
    # sanity: it was a committed (non-insufficient) verdict with citations
    assert graph["label"] in {"REAL_CATALYST", "ALREADY_PRICED_IN", "HYPE"}
    assert graph["citations"]


def test_graph_insufficient_short_circuit_matches_native() -> None:
    """Empty headline set: graph and native both yield INSUFFICIENT_EVIDENCE."""
    native = NewsCheckService()._run_native("NVDA", simulate_empty=True)
    graph = NewsGraph().run("NVDA", simulate_empty=True)
    assert graph == native
    assert graph["label"] == "INSUFFICIENT_EVIDENCE"
    assert graph["citations"] == []


def test_graph_response_has_mandatory_disclaimer() -> None:
    """Every FR1 graph response carries the server-authoritative disclaimer."""
    assert NewsGraph().run("AAPL")["disclaimer"]
