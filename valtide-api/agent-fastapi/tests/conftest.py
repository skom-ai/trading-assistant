"""Pytest fixtures and environment pinning.

File: tests/conftest.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Forces the deterministic mock LLM provider for the entire test suite so
    unit/integration tests never depend on a live API key or paid calls,
    and clears the settings cache so the pin takes effect.
"""
from __future__ import annotations

import os

import pytest

from app.core.config import get_settings


@pytest.fixture(autouse=True, scope="session")
def _force_mock_llm() -> None:
    """Pin VT_LLM_PROVIDER=mock for all tests (autouse, session scope)."""
    os.environ["VT_LLM_PROVIDER"] = "mock"
    os.environ.pop("VT_LLM_API_KEY", None)
    os.environ.pop("GEMINI_API_KEY", None)
    get_settings.cache_clear()
