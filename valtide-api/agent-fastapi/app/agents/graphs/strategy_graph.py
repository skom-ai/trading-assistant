"""FR3 strategy + FR4 analog LangGraph flow (LangChain migration).

File: app/agents/graphs/strategy_graph.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    The FR3 strategy path expressed as a LangGraph StateGraph, preserving
    the EXACT node order and semantics of the native StrategyService.run
    (SDD §3.4, DDD §3/§4.5):
        framing_neutralize
          -> sufficiency_gate --(insufficient)--> END (no LLM, no numbers)
                              --(sufficient)--> generate_coherent
                                 (LLM via bounded parser + coherence
                                  regenerate-or-fail, bounded to _MAX_REGEN)
          -> release_gate (linter + traceability on the strategy narrative)
          -> analog_branch (deterministic FR4 matcher, partial-failure
             ISOLATED so its failure never nulls the strategy)
          -> assemble_payload --> END
    Every node reuses the existing validators / parser / release gate /
    analog matcher verbatim, so output is identical to the native path.
    The deterministic analog engine still makes no LLM call (P2).

Source: specs/arch/DDD.md §3, §4.5; specs/arch/SDD.md §3.4; langchain-upgrade.md §4
"""
from __future__ import annotations

import logging
from typing import Any, TypedDict

from langgraph.graph import END, START, StateGraph

from app.adapters.llm_adapter import LLMAdapter, get_llm_adapter
from app.agents.structured_parser import parse_with_retries
from app.core.config import get_settings
from app.core.errors import DomainError, ErrorCode
from app.domain.enums import StrategyVerdict
from app.domain.schemas import StrategyRecommendation
from app.engine import analog_matcher
from app.guardrails import release_gate, validators

logger = logging.getLogger(__name__)

_MAX_REGEN = 1  # bounded regenerate-or-fail (identical to native service)


class StrategyState(TypedDict, total=False):
    """Mutable state threaded through the FR3 graph.

    Attributes:
        symbol: Resolved ticker.
        evidence: Evidence block (factors, last_price, news_label, ids, ...).
        analog_cases: Curated FR4 cases to match against.
        user_framing: Optional free-text framing to neutralize.
        strategy: The coherent StrategyRecommendation (sufficient path).
        analogs: FR4 matches (isolated).
        analog_error: Error code string if the analog branch failed.
        response: Final combined response dict.
    """

    symbol: str
    evidence: dict[str, Any]
    analog_cases: list[dict]
    user_framing: str | None
    strategy: StrategyRecommendation
    analogs: list[dict]
    analog_error: str | None
    response: dict[str, Any]


class StrategyGraph:
    """Compiled FR3 LangGraph, behavior-equivalent to StrategyService."""

    def __init__(self, adapter: LLMAdapter | None = None) -> None:
        """Build and compile the FR3 state graph.

        Args:
            adapter: Optional LLMAdapter override (tests); defaults to the
                config-selected adapter.
        """
        self._adapter = adapter
        self._graph = self._build()

    def _build(self):
        """Assemble the StateGraph with the fixed FR3 node order.

        Returns:
            The compiled LangGraph app.
        """
        g = StateGraph(StrategyState)
        g.add_node("framing_neutralize", self._framing_neutralize)
        g.add_node("sufficiency_gate", self._sufficiency_gate)
        g.add_node("generate_coherent", self._generate_coherent)
        g.add_node("release_gate", self._release_gate)
        g.add_node("analog_branch", self._analog_branch)
        g.add_node("assemble_payload", self._assemble_payload)

        g.add_edge(START, "framing_neutralize")
        g.add_edge("framing_neutralize", "sufficiency_gate")
        g.add_conditional_edges(
            "sufficiency_gate", self._route_sufficiency,
            {"sufficient": "generate_coherent", "insufficient": END},
        )
        g.add_edge("generate_coherent", "release_gate")
        g.add_edge("release_gate", "analog_branch")
        g.add_edge("analog_branch", "assemble_payload")
        g.add_edge("assemble_payload", END)
        return g.compile()

    # --- nodes -----------------------------------------------------------

    def _framing_neutralize(self, state: StrategyState) -> StrategyState:
        """Anti-sycophancy input scrub on the optional user framing."""
        evidence = dict(state["evidence"])
        evidence["neutral_framing"] = validators.neutralize_framing(
            state.get("user_framing"))
        state["evidence"] = evidence
        return state

    def _sufficiency_gate(self, state: StrategyState) -> StrategyState:
        """No numeric plan on absent evidence (short-circuit, no LLM)."""
        ev_ids = state["evidence"].get("evidence_ids", [])
        if not validators.evaluate_sufficiency(len(ev_ids),
                                               bool(state["evidence"].get("factors"))):
            state["response"] = self._insufficient(state["symbol"])
        return state

    def _route_sufficiency(self, state: StrategyState) -> str:
        """Route to END when the insufficient response is already set."""
        return "insufficient" if "response" in state else "sufficient"

    def _generate_coherent(self, state: StrategyState) -> StrategyState:
        """Generate a strategy and enforce numeric coherence with retries.

        Bounded regenerate-or-fail (never unbounded), identical to the
        native StrategyService._generate_coherent.
        """
        adapter = self._adapter or get_llm_adapter()
        evidence = state["evidence"]
        recent = float(evidence.get("last_price", 100.0) or 100.0)
        for attempt in range(_MAX_REGEN + 1):
            rec = parse_with_retries(
                adapter, "FR3_STRATEGY", f"Generate a strategy for {state['symbol']}.",
                evidence, StrategyRecommendation)
            if validators.validate_coherence(rec, recent):
                state["strategy"] = rec
                return state
            logger.warning("coherence regenerate attempt %d for %s",
                           attempt + 1, state["symbol"])
        raise DomainError(
            ErrorCode.AGENT_OUTPUT_INVALID,
            "Could not produce a numerically coherent strategy.",
            {"symbol": state["symbol"]})

    def _release_gate(self, state: StrategyState) -> StrategyState:
        """Linter + traceability on the strategy narrative."""
        strategy = state["strategy"]
        ev_ids = state["evidence"].get("evidence_ids", [])
        release_gate.lint_language(strategy.rationale)
        release_gate.enforce_traceability(strategy.cited_evidence_ids, set(ev_ids))
        return state

    def _analog_branch(self, state: StrategyState) -> StrategyState:
        """Run the analog matcher with partial-failure isolation.

        On failure the strategy result still stands; only this section
        reports the error (identical to native _safe_analogs).
        """
        evidence = state["evidence"]
        try:
            candidate = {
                "catalyst": evidence.get("catalyst", "OTHER"),
                "tags": evidence.get("tags", []),
                "factors": evidence.get("analog_factors", {}),
            }
            matches = analog_matcher.match_analogs(
                candidate, state["analog_cases"],
                get_settings().analog_similarity_version)
            state["analogs"] = [m.model_dump() for m in matches]
            state["analog_error"] = None
        except Exception:  # noqa: BLE001 - isolation is the point
            logger.exception("analog branch failed; isolating from strategy")
            state["analogs"] = []
            state["analog_error"] = ErrorCode.SOURCE_UNAVAILABLE.value
        return state

    def _assemble_payload(self, state: StrategyState) -> StrategyState:
        """Combine independent strategy + analog sections with disclaimers."""
        strategy = state["strategy"]
        logger.info("FR3 verdict %s for %s; analogs=%d", strategy.verdict.value,
                    state["symbol"], len(state["analogs"]))
        state["response"] = {
            "symbol": state["symbol"],
            "strategy": strategy.model_dump(mode="json"),
            "analogs": state["analogs"],
            "analog_error": state["analog_error"],
            "disclaimer": release_gate.disclaimer_for("strategy"),
            "analog_disclaimer": release_gate.disclaimer_for("analog"),
        }
        return state

    def _insufficient(self, symbol: str) -> dict[str, Any]:
        """Build the INSUFFICIENT_EVIDENCE strategy response (no numbers).

        Args:
            symbol: The ticker.

        Returns:
            A response dict with no numeric levels (identical to native).
        """
        return {
            "symbol": symbol,
            "strategy": {
                "verdict": StrategyVerdict.INSUFFICIENT_EVIDENCE.value,
                "entry": None, "target": None, "stop": None,
                "holding_horizon": None, "confidence": "LOW",
                "rationale": "Insufficient evidence: no reliable news or fundamentals.",
                "cited_evidence_ids": [],
                "applicability_flags": {"entry": "not_applicable"},
            },
            "analogs": [], "analog_error": None,
            "disclaimer": release_gate.disclaimer_for("strategy"),
            "analog_disclaimer": release_gate.disclaimer_for("analog"),
        }

    # --- public API ------------------------------------------------------

    def run(self, symbol: str, evidence: dict[str, Any],
            analog_cases: list[dict],
            user_framing: str | None = None) -> dict[str, Any]:
        """Generate a strategy plus its historical analogs.

        Args:
            symbol: The resolved ticker symbol.
            evidence: Evidence block (factors, last_price, news_label,
                evidence_ids, catalyst, tags, analog_factors).
            analog_cases: Curated cases to match against (FR4).
            user_framing: Optional free-text framing to neutralize.

        Returns:
            A combined dict with independent "strategy" and "analogs"
            sections and server-authoritative disclaimers.
        """
        final = self._graph.invoke({
            "symbol": symbol, "evidence": evidence,
            "analog_cases": analog_cases, "user_framing": user_framing,
        })
        return final["response"]
