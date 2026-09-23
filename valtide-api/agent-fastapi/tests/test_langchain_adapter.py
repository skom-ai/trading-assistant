"""Parity tests for the LangChain Gemini adapter (LangChain migration).

File: tests/test_langchain_adapter.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    Proves the LangChainGeminiAdapter is a behavior-equivalent drop-in for
    the native GeminiLLMAdapter behind the shared LLMAdapter port:
      - the factory selects it only when VT_LLM_FRAMEWORK=langchain;
      - it returns a schema-shaped dict (SDK fully mocked, no network/key);
      - that dict validates against the SAME Pydantic schema and produces
        the SAME validated object the native path would, through the
        unchanged StructuredOutputParser (parse_with_retries);
      - transient errors after bounded retries degrade to {} exactly like
        the native adapter, so the retrying parser reacts identically.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.adapters.llm_adapter import get_llm_adapter
from app.agents.structured_parser import parse_with_retries
from app.core.config import Settings
from app.domain.enums import NewsVerdictLabel, StrategyVerdict
from app.domain.schemas import NewsVerdict, StrategyRecommendation


def _mock_chat(structured_return):
    """Build a mock ChatGoogleGenerativeAI whose structured chain returns a value.

    Args:
        structured_return: The object the invoked structured runnable yields.

    Returns:
        A MagicMock standing in for the ChatGoogleGenerativeAI class.
    """
    chat_instance = MagicMock()
    # with_structured_output(...).with_retry(...).invoke(...) -> structured_return
    chat_instance.with_structured_output.return_value.with_retry.return_value.invoke.return_value = (
        structured_return
    )
    chat_cls = MagicMock(return_value=chat_instance)
    return chat_cls


def test_factory_builds_langchain_adapter_when_selected() -> None:
    """provider=gemini + framework=langchain + key -> LangChain adapter."""
    with patch("langchain_google_genai.ChatGoogleGenerativeAI"):
        from app.adapters.langchain_gemini_adapter import LangChainGeminiAdapter

        s = Settings(llm_provider="gemini", llm_api_key="AIza-test",
                     llm_framework="langchain")
        assert isinstance(get_llm_adapter(s), LangChainGeminiAdapter)


def test_factory_native_default_is_not_langchain() -> None:
    """The default framework=native does NOT return the LangChain adapter."""
    with patch("google.genai.Client"):
        from app.adapters.gemini_adapter import GeminiLLMAdapter

        s = Settings(llm_provider="gemini", llm_api_key="AIza-test")  # native default
        assert isinstance(get_llm_adapter(s), GeminiLLMAdapter)


def test_langchain_news_output_is_schema_valid_and_parses() -> None:
    """FR1: adapter dict validates + parse_with_retries yields the same object."""
    expected = NewsVerdict(
        label=NewsVerdictLabel.REAL_CATALYST, rationale="grounded",
        cited_headline_ids=["NVDA-h0"], confidence_hint="MEDIUM")
    chat_cls = _mock_chat(expected)
    with patch("langchain_google_genai.ChatGoogleGenerativeAI", chat_cls):
        from app.adapters.langchain_gemini_adapter import LangChainGeminiAdapter

        adapter = LangChainGeminiAdapter(api_key="k", model="gemini-3.6-flash",
                                         temperature=0.1)
        out = adapter.complete_json("FR1_NEWS", "p", {"headlines": []})
        # schema-valid dict
        assert NewsVerdict.model_validate(out) == expected
        # equivalent through the UNCHANGED parser used by the services
        parsed = parse_with_retries(adapter, "FR1_NEWS", "p", {"headlines": []}, NewsVerdict)
        assert parsed == expected


def test_langchain_strategy_output_is_schema_valid_and_parses() -> None:
    """FR3: adapter dict validates + parse_with_retries yields the same object."""
    expected = StrategyRecommendation(
        verdict=StrategyVerdict.BUY, entry=100.0, target=110.0, stop=95.0,
        holding_horizon="1-3 months", confidence="MEDIUM", rationale="grounded",
        cited_evidence_ids=["NVDA-fRSI_14"], applicability_flags={})
    chat_cls = _mock_chat(expected)
    with patch("langchain_google_genai.ChatGoogleGenerativeAI", chat_cls):
        from app.adapters.langchain_gemini_adapter import LangChainGeminiAdapter

        adapter = LangChainGeminiAdapter(api_key="k", model="gemini-3.6-flash",
                                         temperature=0.1)
        out = adapter.complete_json("FR3_STRATEGY", "p", {"factors": {}})
        assert StrategyRecommendation.model_validate(out) == expected
        parsed = parse_with_retries(adapter, "FR3_STRATEGY", "p", {}, StrategyRecommendation)
        assert parsed == expected


def test_langchain_transient_error_degrades_to_empty() -> None:
    """A transient error after retries returns {} (parser then reacts)."""
    chat_instance = MagicMock()
    chat_instance.with_structured_output.return_value.with_retry.return_value.invoke.side_effect = (
        RuntimeError("503 UNAVAILABLE: model overloaded")
    )
    chat_cls = MagicMock(return_value=chat_instance)
    with patch("langchain_google_genai.ChatGoogleGenerativeAI", chat_cls):
        from app.adapters.langchain_gemini_adapter import LangChainGeminiAdapter

        adapter = LangChainGeminiAdapter(api_key="k", model="gemini-3.6-flash",
                                         temperature=0.1)
        assert adapter.complete_json("FR1_NEWS", "p", {"headlines": []}) == {}
