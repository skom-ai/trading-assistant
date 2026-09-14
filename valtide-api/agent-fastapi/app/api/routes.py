"""FastAPI routers — internal AI/engine surface (STOCK-100/200/300/400).

File: app/api/routes.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    The internal HTTP surface the NestJS BFF calls (never public). One
    router groups the feature endpoints; each delegates to a Process-layer
    service and returns its plain dict, which FastAPI serializes and
    documents in OpenAPI/Swagger.

Source: specs/arch/SDD.md §3, specs/arch/DDD.md
"""
from __future__ import annotations

import logging

from fastapi import APIRouter

from app.api.dtos import NewsCheckRequest, ScanRequest, StrategyRequest
from app.repositories import reference_data
from app.services.news_service import NewsCheckService
from app.services.scanner_service import ScannerService
from app.services.strategy_service import StrategyService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/internal/v1", tags=["agent"])

_news = NewsCheckService()
_scanner = ScannerService()
_strategy = StrategyService()

_UNIVERSE_MIN, _UNIVERSE_MAX = 75, 100


@router.post("/news-check", summary="FR1 news-driven opportunity verdict")
def news_check(body: NewsCheckRequest) -> dict:
    """Classify a ticker's news-driven move.

    Args:
        body: The FR1 request (symbol, optional simulate_empty).

    Returns:
        The verdict payload (label, rationale, citations, disclaimer).
    """
    return _news.run(body.symbol, simulate_empty=body.simulate_empty)


@router.post("/scan", summary="FR2 deterministic top-10 scan (zero-LLM)")
def scan(body: ScanRequest) -> dict:
    """Run the deterministic scanner over the universe.

    Args:
        body: The FR2 request (optional explicit universe).

    Returns:
        The ranked top-10 payload with raw factors per row.
    """
    universe = body.universe or reference_data.get_universe()
    universe = universe[:_UNIVERSE_MAX]  # bounds guard
    return _scanner.run(universe)


@router.post("/strategy", summary="FR3 strategy + FR4 analog co-execution")
def strategy(body: StrategyRequest) -> dict:
    """Generate a strategy and its historical analogs for a ticker.

    Args:
        body: The FR3/FR4 request (symbol, optional framing/news label).

    Returns:
        The combined strategy + analogs payload with disclaimers.
    """
    # Build the evidence block from a deterministic scan of the single name.
    scan_row = _scanner.run([body.symbol])["rows"][0]
    factors = scan_row["factors"]
    evidence = {
        "factors": factors,
        "last_price": scan_row["last_price"],
        "news_label": body.news_label or "ALREADY_PRICED_IN",
        "evidence_ids": [f"{body.symbol}-f{k}" for k in factors],
        "catalyst": "EARNINGS_BEAT",
        "tags": ["momentum"] if (factors.get("MOMENTUM_3M") or 0) > 0 else ["weak_momentum"],
        "analog_factors": {
            "rsi14": factors.get("RSI_14"), "mom3m": factors.get("MOMENTUM_3M"),
            "mom6m": factors.get("MOMENTUM_6M"),
            "valuation_z": factors.get("VALUATION_ZSCORE"),
            "vol_ratio": factors.get("VOLUME_TREND"),
        },
    }
    return _strategy.run(body.symbol, evidence,
                         reference_data.get_analog_cases(), body.user_framing)
