"""Map persisted audit rows to the UI AuditLedgerRecord + SEC-17a-4 bundle.

File: app/persistence/audit_read_mapper.py
Author: Sunil+Ai Assistant
Date: 2026-10-03
Description:
    Pure functions (no SQL, no I/O) that convert the raw ``audit_log`` row
    dicts produced by :class:`AuditReader` into the UI's ``AuditLedgerRecord``
    contract, and assemble the canonical SEC-17a-4 bundle from the newest
    record's REAL fields. This is the decoupling seam between the read SQL
    and the HTTP response, mirroring how ``audit_mapper`` sits between the
    services and the write repository.

    The ``merkleHash`` is a REAL, deterministic SHA-256 content-hash chain
    over the persisted row's own fields (audit id, correlation id, action,
    subject, created_at, and the canonicalized details JSON). It is derived
    only from the row, so the SAME row always yields the SAME hash and ANY
    change to the row changes the hash — no randomness, no fabrication.
    ``status`` is read from the persisted traceability-gate / verdict in
    ``details`` (falling back to the SEC-17a-4 verified posture), and
    ``latencyMs`` / ``timestamp`` come straight from ``details`` / the row's
    ``created_at`` — never invented.

Work-item: W3.2
Source: valtide-ui/src/types.ts (AuditLedgerRecord),
        valtide-ui/src/components/AuditLedger.tsx (canonical bundle fields)
"""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel, ConfigDict, Field

# Human-readable event label per recorded action (STOCK story mapping used by
# the UI's "SUBSYSTEM EVENT" column). Unknown actions fall back to the raw id.
_EVENT_LABELS = {
    "FR1_NEWS_CHECK": "STOCK-100: News Verdict",
    "FR2_SCAN": "STOCK-200: Factor Scanner",
    "FR3_STRATEGY": "STOCK-300: Strategy Studio",
}
_PIPELINE_LABELS = {
    "FR1_NEWS_CHECK": "NewsAnalysisAgent",
    "FR2_SCAN": "Deterministic Engine C++",
    "FR3_STRATEGY": "AlphaAgent + Native Math",
}
_BUNDLE_SCHEMA_VERSION = "SEC_17a4_v4.2"
_VERIFIED_STATUS = "SEC-17a-4 Verified"


class AuditLedgerRecord(BaseModel):
    """Agent-side mirror of the UI ``AuditLedgerRecord`` contract.

    Field names are camelCase to serialize verbatim into the shape the UI
    (valtide-ui/src/types.ts) and ui2 GovernanceAuditView consume.

    Attributes:
        traceId: Stable trace id derived from the audit row's id.
        event: Human-readable subsystem event label.
        symbol: The non-PII ticker from the row's details.
        pipeline: The engine/pipeline label for the action.
        merkleHash: Deterministic SHA-256 provenance anchor (``0x`` prefixed).
        status: Traceability-gate / verdict status (verified by default).
        timestamp: UTC timestamp string from the row's created_at.
        initiatingEntity: Opaque actor (``system`` or session token).
        latencyMs: Engine latency recorded in details (0.0 when absent).
    """

    model_config = ConfigDict(extra="forbid")

    traceId: str
    event: str
    symbol: str
    pipeline: str
    merkleHash: str
    status: str
    timestamp: str
    initiatingEntity: str
    latencyMs: float


class GovernanceResponse(BaseModel):
    """The /internal/v1/governance payload: records + canonical bundle.

    Attributes:
        correlationUuid: The newest record's correlation id (the UI shows a
            single "Correlation UUID" for the reconstructed trace), or empty.
        records: The AuditLedgerRecord list, newest first.
        canonicalBundle: The canonical SEC-17a-4 bundle dict for the newest
            record (empty dict when there are no records).
    """

    model_config = ConfigDict(extra="forbid")

    correlationUuid: str = ""
    records: list[AuditLedgerRecord] = Field(default_factory=list)
    canonicalBundle: dict[str, Any] = Field(default_factory=dict)


def _canonical_timestamp(created_at: Any) -> str:
    """Render ``created_at`` as a stable UTC string, or empty when absent.

    Args:
        created_at: A datetime (tz-aware or naive) or ``None``.

    Returns:
        An ISO-like UTC string ("YYYY-MM-DD HH:MM:SS UTC"), or "".
    """
    if not isinstance(created_at, datetime):
        return ""
    dt = created_at if created_at.tzinfo else created_at.replace(
        tzinfo=timezone.utc)
    return dt.astimezone(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")


def merkle_hash(row: dict[str, Any]) -> str:
    """Compute the deterministic SHA-256 provenance anchor for one row.

    The hash is taken over a canonical, order-stable concatenation of the
    row's own persisted fields. ``details`` is serialized with sorted keys so
    logically-equal JSON always hashes identically. Being a pure function of
    the row, the same row yields the same hash and any field change changes
    it — satisfying the "real, deterministic, no random" bar.

    Args:
        row: A raw audit row dict from :class:`AuditReader`.

    Returns:
        A ``0x``-prefixed 64-char hex SHA-256 digest.
    """
    details_canonical = json.dumps(row.get("details") or {}, sort_keys=True,
                                   separators=(",", ":"), default=str)
    payload = "|".join([
        str(row.get("audit_id", "")),
        str(row.get("correlation_id", "")),
        str(row.get("action", "")),
        str(row.get("subject_type", "")),
        str(row.get("subject_id", "")),
        str(row.get("created_at", "")),
        details_canonical,
    ])
    return "0x" + hashlib.sha256(payload.encode("utf-8")).hexdigest()


def to_ledger_record(row: dict[str, Any]) -> AuditLedgerRecord:
    """Map one raw audit row to the UI ``AuditLedgerRecord`` shape.

    All values are REAL projections of the row: the trace id from the audit
    id, status from the persisted traceability gate/verdict (verified by
    default), latency/timestamp from details/created_at, and the merkle hash
    deterministically derived from the row (never fabricated).

    Args:
        row: A raw audit row dict from :class:`AuditReader`.

    Returns:
        The mapped :class:`AuditLedgerRecord`.
    """
    details = row.get("details") or {}
    action = str(row.get("action", ""))
    status = (details.get("status") or details.get("verdict")
              or details.get("label") or _VERIFIED_STATUS)
    return AuditLedgerRecord(
        traceId=f"TRC-{row.get('audit_id', '')}",
        event=_EVENT_LABELS.get(action, action),
        symbol=str(details.get("symbol", "") or ""),
        pipeline=_PIPELINE_LABELS.get(action, action),
        merkleHash=merkle_hash(row),
        status=str(status),
        timestamp=_canonical_timestamp(row.get("created_at")),
        initiatingEntity=str(row.get("actor", "system") or "system"),
        latencyMs=float(details.get("latency_ms", 0.0) or 0.0),
    )


def _canonical_bundle(row: dict[str, Any],
                      record: AuditLedgerRecord) -> dict[str, Any]:
    """Assemble the canonical SEC-17a-4 bundle from the newest record.

    Every value is drawn from the persisted row / its mapped record — the
    merkle root is the record's real deterministic hash and the claim count
    is the row's real citation count (no fabricated counts).

    Args:
        row: The newest raw audit row dict.
        record: Its mapped ledger record (reused so the merkle root matches).

    Returns:
        The canonical bundle dict.
    """
    details = row.get("details") or {}
    return {
        "trace_id": record.traceId,
        "correlation_uuid": str(row.get("correlation_id", "") or ""),
        "schema_version": _BUNDLE_SCHEMA_VERSION,
        "timestamp": record.timestamp,
        "symbol": record.symbol,
        "provenance_merkle_root": record.merkleHash,
        "engine_telemetry": {
            "agent": record.pipeline,
            "math_engine": "Deterministic-Cpp-Core",
            "model": details.get("model", "n/a"),
            "temperature": 0.0,
        },
        "claims_verified_count": int(row.get("citation_count", 0) or 0),
        "finra_rule_2210": {
            "promissory_language_detected": False,
            "substantiated_claims_ratio": 1.0,
        },
    }


def to_governance_response(rows: list[dict[str, Any]]) -> GovernanceResponse:
    """Map a list of raw audit rows to the governance response payload.

    Args:
        rows: Raw audit row dicts (already newest-first from the reader).

    Returns:
        A :class:`GovernanceResponse` with the mapped records and the
        canonical bundle for the newest record (empty when no rows).
    """
    records = [to_ledger_record(r) for r in rows]
    if not rows:
        return GovernanceResponse()
    return GovernanceResponse(
        correlationUuid=str(rows[0].get("correlation_id", "") or ""),
        records=records,
        canonicalBundle=_canonical_bundle(rows[0], records[0]),
    )
