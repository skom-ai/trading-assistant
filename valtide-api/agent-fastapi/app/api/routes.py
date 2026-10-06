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
import time

from fastapi import APIRouter, Query

from app.api.dtos import NewsCheckRequest, ScanRequest, StrategyRequest
from app.core.config import get_settings
from app.persistence import audit_mapper, audit_read_mapper
from app.persistence.audit_read_mapper import GovernanceResponse
from app.persistence.audit_reader import AuditReader
from app.persistence.audit_repository import AuditRecord, AuditRepository
from app.repositories import reference_data
from app.services.news_service import NewsCheckService
from app.services.scanner_service import ScannerService
from app.services.strategy_service import StrategyService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/internal/v1", tags=["agent"])

_news = NewsCheckService()
_scanner = ScannerService()
_strategy = StrategyService()
# Append-only governance writer (FR5 / W3.1). record_request is itself
# failure-isolated, so the route-level calls below can never break a request.
_audit = AuditRepository()
# Governance READ path (FR5 / W3.2). SELECT-only; separate class from the
# writer so read and write capabilities stay decoupled (least privilege).
_audit_reader = AuditReader()

_UNIVERSE_MIN, _UNIVERSE_MAX = 75, 100


def _audit_safe(record: AuditRecord) -> None:
    """Append an audit record, absorbing any unexpected mapping error.

    The repository already isolates DB failures; this extra guard covers the
    (unlikely) case of a mapper raising, so audit is never on the request's
    critical path.

    Args:
        record: The audit event to append.
    """
    try:
        _audit.record_request(record)
    except Exception:  # noqa: BLE001 — audit must never break the response.
        logger.error("audit mapping/record failed; response unaffected",
                     exc_info=True)


@router.post("/news-check", summary="FR1 news-driven opportunity verdict")
def news_check(body: NewsCheckRequest) -> dict:
    """Classify a ticker's news-driven move.

    Args:
        body: The FR1 request (symbol, optional simulate_empty).

    Returns:
        The verdict payload (label, rationale, citations, disclaimer).
    """
    started = time.perf_counter()
    result = _news.run(body.symbol, simulate_empty=body.simulate_empty)
    latency_ms = (time.perf_counter() - started) * 1000.0
    _audit_safe(audit_mapper.for_news(
        body.symbol, result, get_settings().llm_model, latency_ms))
    return result


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
    started = time.perf_counter()
    result = _scanner.run(universe)
    latency_ms = (time.perf_counter() - started) * 1000.0
    _audit_safe(audit_mapper.for_scan(result, latency_ms))
    return result


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
    started = time.perf_counter()
    result = _strategy.run(body.symbol, evidence,
                           reference_data.get_analog_cases(), body.user_framing)
    latency_ms = (time.perf_counter() - started) * 1000.0
    _audit_safe(audit_mapper.for_strategy(
        body.symbol, result, get_settings().llm_model, latency_ms))
    return result


@router.get("/governance", summary="FR5 governance audit ledger (read)",
            response_model=GovernanceResponse)
def governance(
    symbol: str | None = Query(default=None,
                               description="Optional ticker filter."),
    correlation_id: str | None = Query(
        default=None, description="Optional correlation UUID filter."),
    limit: int = Query(default=100, ge=1, le=1000,
                       description="Max rows, newest first."),
) -> GovernanceResponse:
    """Return the audit ledger as AuditLedgerRecord[] + canonical bundle.

    Reads append-only ``audit_log`` rows (newest first, SELECT-only) with
    optional symbol / correlation filters, resolves each row's real citation
    count, and maps every row to the UI's ``AuditLedgerRecord`` shape with a
    deterministic SHA-256 merkle hash. The newest record also yields the
    canonical SEC-17a-4 bundle.

    Args:
        symbol: Optional ticker filter (non-PII details.symbol).
        correlation_id: Optional correlation UUID filter.
        limit: Max rows to return (bounded 1..1000).

    Returns:
        The governance response (correlation uuid, records, canonical bundle).
    """
    rows = _audit_reader.fetch_records(
        symbol=symbol, correlation_id=correlation_id, limit=limit)
    return audit_read_mapper.to_governance_response(rows)
