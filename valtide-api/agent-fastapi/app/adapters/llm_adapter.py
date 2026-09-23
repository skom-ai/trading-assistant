"""LLM provider adapter (S4 / STOCK-607).

File: app/adapters/llm_adapter.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Defines the LLM port and a DETERMINISTIC mock implementation used by
    default so the platform is fully functional and testable offline. The
    mock derives verdicts/strategies from the supplied evidence (not from
    randomness), which lets anti-sycophancy and coherence tests assert
    stable behavior. A live provider (OpenRouter) is swapped purely by
    config via get_llm_adapter().

Source: specs/arch/SDD.md §3.2, §4
"""
from __future__ import annotations

import hashlib
import json
import logging
from typing import Protocol

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)


class LLMAdapter(Protocol):
    """Port for structured LLM completion."""

    def complete_json(self, feature: str, prompt: str, evidence: dict) -> dict:
        """Return a structured JSON object for the given feature/evidence.

        Args:
            feature: "FR1_NEWS" or "FR3_STRATEGY".
            prompt: The fully assembled prompt (already neutralized).
            evidence: Structured evidence block the output must reflect.

        Returns:
            A dict matching the feature's Pydantic schema (pre-validation).
        """
        ...


class MockLLMAdapter:
    """Deterministic, evidence-driven mock LLM.

    Verdicts are computed from simple, transparent heuristics over the
    evidence so identical evidence always yields identical output — the
    property the guardrail/anti-sycophancy tests rely on.
    """

    def __init__(self, model: str) -> None:
        """Initialize the mock adapter.

        Args:
            model: Model label recorded on outputs/traces.
        """
        self._model = model

    def _seed(self, evidence: dict) -> int:
        """Derive a stable integer seed from evidence content."""
        blob = json.dumps(evidence, sort_keys=True, default=str)
        return int(hashlib.sha256(blob.encode()).hexdigest(), 16)

    def complete_json(self, feature: str, prompt: str, evidence: dict) -> dict:
        """Produce a deterministic structured output for the feature.

        Args:
            feature: "FR1_NEWS" or "FR3_STRATEGY".
            prompt: The assembled prompt (unused by the mock beyond logs).
            evidence: The structured evidence block.

        Returns:
            A schema-shaped dict derived deterministically from evidence.
        """
        logger.debug("mock LLM complete_json feature=%s", feature)
        if feature == "FR1_NEWS":
            return self._news_verdict(evidence)
        return self._strategy(evidence)

    def _news_verdict(self, evidence: dict) -> dict:
        """Classify headlines using deterministic keyword heuristics."""
        headlines = evidence.get("headlines", [])
        ids = [h["id"] for h in headlines]
        text = " ".join(h.get("title", "").lower() for h in headlines)
        catalyst_terms = ("beat", "raise", "surge", "approval", "launch", "record")
        priced_terms = ("as expected", "in line", "reiterate", "maintains")
        hype_terms = ("rumor", "speculation", "could", "meme", "buzz")
        if any(t in text for t in catalyst_terms):
            label = "REAL_CATALYST"
        elif any(t in text for t in priced_terms):
            label = "ALREADY_PRICED_IN"
        elif any(t in text for t in hype_terms):
            label = "HYPE"
        else:
            label = "ALREADY_PRICED_IN"
        return {
            "label": label,
            "rationale": f"Classified {label} from {len(headlines)} cited headline(s).",
            "cited_headline_ids": ids,
            "confidence_hint": "MEDIUM",
        }

    def _strategy(self, evidence: dict) -> dict:
        """Derive a Buy/Wait/Avoid plan from evidence strength + factors."""
        factors = evidence.get("factors", {})
        # Prefer the normalized lowercase snapshot; fall back to the enum key.
        snapshot = evidence.get("analog_factors", {})
        price = float(evidence.get("last_price", 100.0) or 100.0)
        mom = snapshot.get("mom3m")
        if mom is None:
            mom = factors.get("MOMENTUM_3M")
        mom = float(mom or 0.0)
        news = evidence.get("news_label", "ALREADY_PRICED_IN")
        cited = evidence.get("evidence_ids", [])
        if news == "REAL_CATALYST" and mom > 0:
            verdict, conf = "BUY", "MEDIUM"
            entry, target, stop = price, round(price * 1.10, 4), round(price * 0.95, 4)
            flags: dict[str, str] = {}
        elif news == "HYPE" or mom < -0.15:
            verdict, conf = "AVOID", "MEDIUM"
            entry = target = stop = None
            flags = {"entry": "not_applicable", "target": "not_applicable", "stop": "not_applicable"}
        else:
            verdict, conf = "WAIT", "LOW"
            entry = target = stop = None
            flags = {"entry": "conditional_reference_only"}
        return {
            "verdict": verdict, "entry": entry, "target": target, "stop": stop,
            "holding_horizon": "1-3 months", "confidence": conf,
            "rationale": f"{verdict} based on news={news}, 3M momentum={mom:.2f}.",
            "cited_evidence_ids": cited, "applicability_flags": flags,
        }


def get_llm_adapter(settings: Settings | None = None) -> LLMAdapter:
    """Return the configured LLM adapter.

    Selection by VT_LLM_PROVIDER:
      - 'gemini'  -> live Google Gemini (requires VT_LLM_API_KEY). The
        VT_LLM_FRAMEWORK setting then picks the binding: 'langchain' uses
        the LangChain adapter (LangGraph/LangSmith path), 'native' (default)
        uses the google-genai SDK adapter. Both satisfy the same port.
      - 'mock'    -> deterministic offline adapter (tests / no key).
    If 'gemini' is requested without a key, we fall back to mock and log a
    warning rather than crash the service.

    Args:
        settings: Optional settings override (defaults to process settings).

    Returns:
        An LLMAdapter implementation.
    """
    settings = settings or get_settings()
    provider = settings.resolved_provider()

    if provider == "local_omni":
        from app.adapters.openai_compat_adapter import OpenAICompatAdapter

        # Build the OpenRouter fallback (used when Local Omni is slow/fails),
        # if an OpenRouter key is available; otherwise Local Omni runs alone.
        fallback = None
        if settings.openrouter_key():
            fallback = OpenAICompatAdapter(
                api_key=settings.openrouter_key() or "",
                model=settings.openrouter_model,
                base_url=settings.openrouter_base_url,
                temperature=settings.llm_temperature,
                provider="openrouter(fallback)",
            )
        logger.info("using Local Omni adapter models=%s (fallback=%s, budget=%ss)",
                    settings.local_omni_models(),
                    "openrouter" if fallback else "none",
                    settings.local_omni_latency_budget_s)
        return OpenAICompatAdapter(
            api_key=settings.local_omni_key() or "",
            model=settings.local_omni_models(),
            base_url=settings.local_omni_base_url,
            temperature=settings.llm_temperature,
            provider="local_omni",
            latency_budget_s=settings.local_omni_latency_budget_s,
            fallback=fallback,
        )

    if provider == "openrouter":
        from app.adapters.openai_compat_adapter import OpenAICompatAdapter

        logger.info("using OpenRouter adapter model=%s", settings.openrouter_model)
        return OpenAICompatAdapter(
            api_key=settings.openrouter_key() or "",
            model=settings.openrouter_model,
            base_url=settings.openrouter_base_url,
            temperature=settings.llm_temperature,
            provider="openrouter",
        )

    if provider == "omni":
        from app.adapters.openai_compat_adapter import OpenAICompatAdapter

        logger.info("using omni (cheaperinference) adapter models=%s", settings.omni_models())
        return OpenAICompatAdapter(
            api_key=settings.omni_key() or "",
            model=settings.omni_models(),
            base_url=settings.omni_base_url,
            temperature=settings.llm_temperature,
            provider="omni",
        )

    if provider == "gemini":
        if not settings.llm_api_key:
            logger.warning("provider=gemini but VT_LLM_API_KEY is empty; using mock")
            return MockLLMAdapter(model=settings.llm_model)

        # Framework selector: 'langchain' routes through LangGraph's LLM
        # binding (langchain-google-genai); 'native' (default) uses the
        # original google-genai SDK adapter. Same LLMAdapter port either way.
        if settings.llm_framework.lower() == "langchain":
            from app.adapters.langchain_gemini_adapter import LangChainGeminiAdapter

            logger.info("using LangChain Gemini adapter model=%s", settings.llm_model)
            return LangChainGeminiAdapter(
                api_key=settings.llm_api_key,
                model=settings.llm_model,
                temperature=settings.llm_temperature,
            )

        from app.adapters.gemini_adapter import GeminiLLMAdapter

        logger.info("using Gemini adapter model=%s", settings.llm_model)
        return GeminiLLMAdapter(
            api_key=settings.llm_api_key,
            model=settings.llm_model,
            temperature=settings.llm_temperature,
        )

    if provider != "mock":
        logger.warning("unknown llm_provider=%s; using mock", provider)
    return MockLLMAdapter(model=settings.llm_model)
