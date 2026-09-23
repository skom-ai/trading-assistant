"""Observability wiring tests (LangChain migration, Phase 5).

File: tests/test_observability.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    Verifies configure_observability is a strict no-op by default, refuses
    to enable tracing without an API key, and sets the standard LANGSMITH_*
    / LANGCHAIN_* environment variables when properly configured. Env is
    cleaned around each case so no state leaks into other tests.
"""
from __future__ import annotations

import os

import pytest

from app.core.config import Settings
from app.core.observability import configure_observability

_TRACE_ENV = [
    "LANGSMITH_TRACING", "LANGCHAIN_TRACING_V2", "LANGSMITH_API_KEY",
    "LANGCHAIN_API_KEY", "LANGSMITH_PROJECT", "LANGCHAIN_PROJECT",
    "LANGSMITH_ENDPOINT", "LANGCHAIN_ENDPOINT",
]


@pytest.fixture(autouse=True)
def _clean_trace_env():
    """Snapshot and restore the tracing env vars around each test."""
    saved = {k: os.environ.get(k) for k in _TRACE_ENV}
    for k in _TRACE_ENV:
        os.environ.pop(k, None)
    yield
    for k, v in saved.items():
        if v is None:
            os.environ.pop(k, None)
        else:
            os.environ[k] = v


def test_disabled_by_default_is_noop() -> None:
    """Default settings: tracing stays off and NO env var is set."""
    assert configure_observability(Settings()) is False
    assert "LANGSMITH_TRACING" not in os.environ


def test_enabled_without_key_stays_off() -> None:
    """Tracing requested but no key: refuses to enable (broken-exporter guard)."""
    s = Settings(langsmith_tracing=True, langsmith_api_key=None)
    assert configure_observability(s) is False
    assert "LANGSMITH_API_KEY" not in os.environ


def test_enabled_with_key_sets_env() -> None:
    """Tracing + key: sets both LANGSMITH_* and legacy LANGCHAIN_* vars."""
    s = Settings(langsmith_tracing=True, langsmith_api_key="ls-test-key",
                 langsmith_project="valtide-agents-test")
    assert configure_observability(s) is True
    assert os.environ["LANGSMITH_TRACING"] == "true"
    assert os.environ["LANGCHAIN_TRACING_V2"] == "true"
    assert os.environ["LANGSMITH_API_KEY"] == "ls-test-key"
    assert os.environ["LANGCHAIN_API_KEY"] == "ls-test-key"
    assert os.environ["LANGSMITH_PROJECT"] == "valtide-agents-test"
