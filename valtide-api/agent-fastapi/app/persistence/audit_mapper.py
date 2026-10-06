"""Map FR1/FR2/FR3 result payloads to append-only AuditRecords.

File: app/persistence/audit_mapper.py
Author: Sunil+Ai Assistant
Date: 2026-10-03
Description:
    Pure functions that build an :class:`AuditRecord` from each flow's
    result dict. They extract ONLY non-PII summary fields (symbol,
    verdict/label, model, weight_version, latency) for ``details`` and map
    each cited evidence id to an :class:`EvidenceRef`. No SQL and no I/O
    here — this is the decoupling seam between the services and the
    repository, keeping both free of each other's concerns.
Work-item: W3.1
Source: valtide-db/postgres/migrations/V005__evidence_and_audit.sql
"""
from __future__ import annotations

from typing import Any

from app.persistence.audit_repository import AuditRecord, EvidenceRef


def for_news(symbol: str, result: dict[str, Any], model: str,
             latency_ms: float) -> AuditRecord:
    """Build the FR1 audit record (NEWS_VERDICT subject, HEADLINE evidence).

    Args:
        symbol: The scanned ticker (not PII).
        result: The NewsCheckService result dict.
        model: The LLM model id recorded on the verdict.
        latency_ms: Request latency in milliseconds.

    Returns:
        An AuditRecord with a non-PII details summary and one HEADLINE
        citation per cited headline id.
    """
    citations = result.get("citations", []) or []
    evidence = [
        EvidenceRef(evidence_type="HEADLINE", evidence_id=c["id"],
                    content_hash=c.get("hash"))
        for c in citations if isinstance(c, dict) and c.get("id")
    ]
    return AuditRecord(
        action="FR1_NEWS_CHECK",
        subject_type="NEWS_VERDICT",
        subject_id=f"{symbol}-news",
        details={"symbol": symbol, "label": result.get("label"),
                 "model": model, "latency_ms": round(latency_ms, 1),
                 "citation_count": len(evidence)},
        evidence=evidence,
    )


def for_scan(result: dict[str, Any], latency_ms: float) -> AuditRecord:
    """Build the FR2 audit record (subject-less; no per-claim citations).

    The deterministic scan cites no LLM evidence, so it records an audit
    event only (weight_version + ranked count), with no citation rows.

    Args:
        result: The ScannerService result dict.
        latency_ms: Request latency in milliseconds.

    Returns:
        An AuditRecord summarizing the scan.
    """
    return AuditRecord(
        action="FR2_SCAN",
        details={"weight_version": result.get("weight_version"),
                 "universe_size": result.get("universe_size"),
                 "ranked": len(result.get("rows", [])),
                 "latency_ms": round(latency_ms, 1)},
    )


def for_strategy(symbol: str, result: dict[str, Any], model: str,
                 latency_ms: float) -> AuditRecord:
    """Build the FR3 audit record (STRATEGY_RECOMMENDATION + SCANNER_FACTOR).

    Args:
        symbol: The ticker (not PII).
        result: The StrategyService result dict.
        model: The LLM model id recorded on the strategy.
        latency_ms: Request latency in milliseconds.

    Returns:
        An AuditRecord with a non-PII details summary and one SCANNER_FACTOR
        citation per cited evidence id.
    """
    strategy = result.get("strategy", {}) or {}
    cited = strategy.get("cited_evidence_ids", []) or []
    evidence = [
        EvidenceRef(evidence_type="SCANNER_FACTOR", evidence_id=str(e))
        for e in cited if e
    ]
    return AuditRecord(
        action="FR3_STRATEGY",
        subject_type="STRATEGY_RECOMMENDATION",
        subject_id=f"{symbol}-strategy",
        details={"symbol": symbol, "verdict": strategy.get("verdict"),
                 "model": model, "latency_ms": round(latency_ms, 1),
                 "citation_count": len(evidence)},
        evidence=evidence,
    )
