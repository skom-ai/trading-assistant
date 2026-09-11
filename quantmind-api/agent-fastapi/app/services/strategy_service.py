"""FR3 Strategy + FR4 Analog co-execution service (STOCK-300/400/405).

File: app/services/strategy_service.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Process-layer orchestration for the strategy path following the exact
    node order in SDD §3.4: FramingNeutralizer -> SufficiencyEvaluator ->
    StrategyNode (LLM, bounded parse) -> CoherenceValidator (bounded
    regenerate-or-fail) -> Analog matcher (parallel, deterministic, with
    partial-failure isolation) -> release gate. Returns a combined payload
    with independent, non-nulling strategy and analog sections.

Source: specs/arch/DDD.md §3, §4.5; specs/arch/SDD.md §3.4
"""
from __future__ import annotations

import logging
from typing import Any

from app.adapters.llm_adapter import get_llm_adapter
from app.agents.structured_parser import parse_with_retries
from app.core.config import get_settings
from app.core.errors import DomainError, ErrorCode
from app.domain.enums import StrategyVerdict
from app.domain.schemas import StrategyRecommendation
from app.engine import analog_matcher
from app.guardrails import release_gate, validators

logger = logging.getLogger(__name__)

_MAX_REGEN = 1  # bounded regenerate-or-fail (never unbounded)


class StrategyService:
    """Coordinates FR3 strategy generation and FR4 analog validation."""

    def run(self, symbol: str, evidence: dict[str, Any],
            analog_cases: list[dict], user_framing: str | None = None) -> dict[str, Any]:
        """Generate a strategy plus its historical analogs.

        Args:
            symbol: The resolved ticker symbol.
            evidence: Evidence block (factors, last_price, news_label,
                evidence_ids, catalyst, tags).
            analog_cases: Curated cases to match against (FR4).
            user_framing: Optional free-text framing to neutralize.

        Returns:
            A combined dict with independent "strategy" and "analogs"
            sections and a server-authoritative disclaimer.
        """
        # 1. Framing neutralization (anti-sycophancy input scrub).
        evidence = dict(evidence)
        evidence["neutral_framing"] = validators.neutralize_framing(user_framing)

        # 2. Sufficiency gate — no numeric plan on absent evidence.
        ev_ids = evidence.get("evidence_ids", [])
        if not validators.evaluate_sufficiency(len(ev_ids), bool(evidence.get("factors"))):
            return self._insufficient(symbol)

        # 3. Strategy generation + 4. coherence (bounded regenerate-or-fail).
        strategy = self._generate_coherent(symbol, evidence)

        # 5. Release gate (linter + traceability) on the strategy narrative.
        release_gate.lint_language(strategy.rationale)
        release_gate.enforce_traceability(strategy.cited_evidence_ids, set(ev_ids))

        # 6. Analog branch — isolated so its failure never nulls the strategy.
        analogs, analog_error = self._safe_analogs(evidence, analog_cases)

        logger.info("FR3 verdict %s for %s; analogs=%d", strategy.verdict.value,
                    symbol, len(analogs))
        return {
            "symbol": symbol,
            "strategy": strategy.model_dump(mode="json"),
            "analogs": analogs,
            "analog_error": analog_error,
            "disclaimer": release_gate.disclaimer_for("strategy"),
            "analog_disclaimer": release_gate.disclaimer_for("analog"),
        }

    def _generate_coherent(self, symbol: str, evidence: dict) -> StrategyRecommendation:
        """Generate a strategy and enforce numeric coherence with retries.

        Args:
            symbol: The ticker.
            evidence: The evidence block.

        Returns:
            A coherent StrategyRecommendation.

        Raises:
            DomainError: AGENT_OUTPUT_INVALID if coherence cannot be met.
        """
        adapter = get_llm_adapter()
        recent = float(evidence.get("last_price", 100.0) or 100.0)
        for attempt in range(_MAX_REGEN + 1):
            rec = parse_with_retries(
                adapter, "FR3_STRATEGY", f"Generate a strategy for {symbol}.",
                evidence, StrategyRecommendation)
            if validators.validate_coherence(rec, recent):
                return rec
            logger.warning("coherence regenerate attempt %d for %s", attempt + 1, symbol)
        raise DomainError(
            ErrorCode.AGENT_OUTPUT_INVALID,
            "Could not produce a numerically coherent strategy.", {"symbol": symbol})

    def _safe_analogs(self, evidence: dict,
                      cases: list[dict]) -> tuple[list[dict], str | None]:
        """Run the analog matcher with partial-failure isolation.

        Args:
            evidence: The evidence block (supplies catalyst/tags/factors).
            cases: Curated analog cases.

        Returns:
            (matches, error_code_or_None). On failure the strategy result
            still stands; only this section reports the error.
        """
        try:
            candidate = {
                "catalyst": evidence.get("catalyst", "OTHER"),
                "tags": evidence.get("tags", []),
                "factors": evidence.get("analog_factors", {}),
            }
            matches = analog_matcher.match_analogs(
                candidate, cases, get_settings().analog_similarity_version)
            return [m.model_dump() for m in matches], None
        except Exception:  # noqa: BLE001 - isolation is the point
            logger.exception("analog branch failed; isolating from strategy")
            return [], ErrorCode.SOURCE_UNAVAILABLE.value

    def _insufficient(self, symbol: str) -> dict[str, Any]:
        """Build the INSUFFICIENT_EVIDENCE strategy response (no numbers).

        Args:
            symbol: The ticker.

        Returns:
            A response dict with no numeric levels.
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
