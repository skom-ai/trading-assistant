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
    """Pin deterministic mock LLM + synthetic data for all tests.

    Tests must never hit the network or a paid/keyed API, so this forces the
    mock LLM provider AND synthetic market/news modes, and clears every live
    provider key that the availability resolver would otherwise pick up.
    """
    os.environ["VT_LLM_PROVIDER"] = "mock"
    os.environ["VT_MARKET_DATA_MODE"] = "synthetic"
    os.environ["VT_NEWS_MODE"] = "synthetic"
    for key in ("VT_LLM_API_KEY", "GEMINI_API_KEY", "OPEN_ROUTER_KEY",
                "OMNI_ROUTE_KEY", "LOCAL_OMNI_KEY"):
        os.environ.pop(key, None)
    get_settings.cache_clear()
