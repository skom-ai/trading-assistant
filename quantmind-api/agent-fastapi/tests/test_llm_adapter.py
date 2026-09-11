"""Unit tests for the LLM adapters and factory selection.

File: tests/test_llm_adapter.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Covers the deterministic mock adapter (same evidence -> same output),
    factory selection (gemini-with-key -> Gemini, no-key -> mock fallback),
    and the Gemini adapter's JSON parsing with a fully mocked SDK client so
    no network call or real key is needed.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.adapters.llm_adapter import MockLLMAdapter, get_llm_adapter
from app.core.config import Settings


def test_mock_is_deterministic_for_same_evidence() -> None:
    """Identical evidence yields identical mock output."""
    adapter = MockLLMAdapter(model="m")
    ev = {"headlines": [{"id": "h1", "title": "beat and raise"}]}
    assert adapter.complete_json("FR1_NEWS", "p", ev) == adapter.complete_json(
        "FR1_NEWS", "p", ev
    )


def test_mock_news_detects_catalyst_keywords() -> None:
    """A 'beat/raise' headline is classified REAL_CATALYST."""
    out = MockLLMAdapter("m").complete_json(
        "FR1_NEWS", "p", {"headlines": [{"id": "h1", "title": "Q3 earnings beat"}]}
    )
    assert out["label"] == "REAL_CATALYST"


def test_factory_falls_back_to_mock_without_key() -> None:
    """provider=gemini with no key returns the mock adapter."""
    s = Settings(llm_provider="gemini", llm_api_key=None)
    assert isinstance(get_llm_adapter(s), MockLLMAdapter)


def test_factory_builds_gemini_with_key() -> None:
    """provider=gemini + key constructs the Gemini adapter (SDK mocked)."""
    with patch("google.genai.Client"):
        from app.adapters.gemini_adapter import GeminiLLMAdapter

        s = Settings(llm_provider="gemini", llm_api_key="AIza-test")
        assert isinstance(get_llm_adapter(s), GeminiLLMAdapter)


def test_gemini_parses_json_and_strips_fences() -> None:
    """The Gemini adapter parses fenced JSON returned by the model."""
    with patch("google.genai.Client") as client_cls:
        from app.adapters.gemini_adapter import GeminiLLMAdapter

        resp = MagicMock()
        resp.text = '```json\n{"label":"HYPE","rationale":"r",' \
                    '"cited_headline_ids":["h1"],"confidence_hint":"LOW"}\n```'
        client_cls.return_value.models.generate_content.return_value = resp
        adapter = GeminiLLMAdapter(api_key="k", model="gemini-2.0-flash", temperature=0.1)
        out = adapter.complete_json("FR1_NEWS", "p", {"headlines": []})
        assert out["label"] == "HYPE"


def test_gemini_returns_empty_on_bad_json() -> None:
    """Unparseable model text yields {} so the retrying parser can react."""
    with patch("google.genai.Client") as client_cls:
        from app.adapters.gemini_adapter import GeminiLLMAdapter

        resp = MagicMock()
        resp.text = "not json at all"
        client_cls.return_value.models.generate_content.return_value = resp
        adapter = GeminiLLMAdapter(api_key="k", model="gemini-2.0-flash", temperature=0.1)
        assert adapter.complete_json("FR3_STRATEGY", "p", {}) == {}
