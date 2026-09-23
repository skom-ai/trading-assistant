"""FastAPI OTel bootstrap tests (LangChain migration, Phase 6).

File: tests/test_otel.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    Verifies configure_otel is a strict no-op unless OTEL_EXPORTER_OTLP_ENDPOINT
    is set, and that it instruments the app when the endpoint IS set. The
    exporter is not actually flushed to a collector here (no network); we only
    assert the enable/no-op decision, which is the app-owned behavior.
"""
from __future__ import annotations

from fastapi import FastAPI

from app.core.otel import configure_otel


def test_otel_noop_without_endpoint(monkeypatch) -> None:
    """No OTEL endpoint -> configure_otel does nothing and returns False."""
    monkeypatch.delenv("OTEL_EXPORTER_OTLP_ENDPOINT", raising=False)
    assert configure_otel(FastAPI(), "valtide-agent") is False


def test_otel_enables_with_endpoint(monkeypatch) -> None:
    """An OTEL endpoint -> instrumentation is applied and returns True."""
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4318")
    # Uses a fresh app so instrumentation does not clash with the suite's app.
    assert configure_otel(FastAPI(), "valtide-agent") is True
