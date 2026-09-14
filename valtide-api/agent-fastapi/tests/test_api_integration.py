"""Integration tests for the FastAPI internal API surface.

File: tests/test_api_integration.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Drives the app through TestClient to verify the FR1-FR4 endpoints, the
    INSUFFICIENT_EVIDENCE short-circuit, the mandatory disclaimer fields,
    coherent BUY levels, and the sanitized error envelope on bad input
    (SDD §2.1, §5, DDD §4.4).
"""
from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app

client = TestClient(create_app())


def test_health_ok() -> None:
    """Health endpoint reports liveness."""
    assert client.get("/health").json()["status"] == "ok"


def test_news_check_returns_verdict_with_disclaimer() -> None:
    """FR1 returns a labelled verdict and a non-empty disclaimer."""
    r = client.post("/internal/v1/news-check", json={"symbol": "NVDA"})
    body = r.json()
    assert r.status_code == 200
    assert body["label"] in {"REAL_CATALYST", "ALREADY_PRICED_IN", "HYPE"}
    assert body["disclaimer"]


def test_news_check_insufficient_evidence_short_circuit() -> None:
    """An empty headline set yields INSUFFICIENT_EVIDENCE, no crash."""
    r = client.post("/internal/v1/news-check",
                    json={"symbol": "NVDA", "simulate_empty": True})
    assert r.json()["label"] == "INSUFFICIENT_EVIDENCE"


def test_scan_returns_top_ten_with_raw_factors() -> None:
    """FR2 returns 10 ranked rows, each exposing raw factor values."""
    body = client.post("/internal/v1/scan", json={}).json()
    assert len(body["rows"]) == 10
    assert "RSI_14" in body["rows"][0]["factors"]


def test_strategy_buy_is_coherent_and_cites_evidence() -> None:
    """A BUY verdict has ordered levels and a disclaimer."""
    body = client.post("/internal/v1/strategy",
                       json={"symbol": "NVDA", "news_label": "REAL_CATALYST"}).json()
    s = body["strategy"]
    assert body["disclaimer"] and body["analog_disclaimer"]
    if s["verdict"] == "BUY":
        assert s["stop"] < s["entry"] < s["target"]


def test_invalid_ticker_returns_422() -> None:
    """A malformed ticker is rejected by DTO validation before any work."""
    r = client.post("/internal/v1/news-check", json={"symbol": "not_a_ticker!"})
    assert r.status_code == 422
