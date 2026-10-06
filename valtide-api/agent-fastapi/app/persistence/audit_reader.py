"""Append-only audit READ path (FR5 governance — least-privilege SELECT).

File: app/persistence/audit_reader.py
Author: Sunil+Ai Assistant
Date: 2026-10-03
Description:
    AuditReader is the read counterpart to the W3.1 ``AuditRepository``. It
    is deliberately a SEPARATE class (SRP / ISP): the writer only ever
    INSERTs, the reader only ever SELECTs, so neither carries the other's
    capability and each can run under its own least-privilege posture. The
    reader issues ONE parameterized SELECT over ``audit_log`` (newest first,
    optional symbol/correlation filter), then a second parameterized SELECT
    that collects the matching ``evidence_citation`` rows so each audit row
    can report its real citation count. No UPDATE/DELETE/INSERT is ever
    issued here.

    Rows are mapped to the UI's ``AuditLedgerRecord`` contract (see
    ``audit_read_mapper``) with a REAL, deterministic SHA-256 merkle hash
    computed from the persisted row fields — never a random or fabricated
    value. Reads reuse the SQLAlchemy engine already pinned by Settings (no
    new dependency); on this build no dedicated ``app_audit_readonly`` role
    is wired, so the reader uses the existing connection but is SELECT-only
    at the SQL level — noted for the W3 decision record.

Work-item: W3.2
Source: valtide-db/postgres/migrations/V005__evidence_and_audit.sql
        (audit_log, evidence_citation), valtide-ui/src/types.ts
        (AuditLedgerRecord)
"""
from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import Connection, Row

from app.core.config import Settings, get_settings

logger = logging.getLogger(__name__)

# Parameterized, SELECT-ONLY statements. ":name" are bound parameters; the
# optional symbol / correlation filters are applied via COALESCE so one
# prepared statement serves the filtered and unfiltered cases without string
# concatenation (no SQL injection surface). ``details->>'symbol'`` reads the
# non-PII symbol the writer stamped into the JSONB summary.
_SELECT_AUDIT = text(
    "SELECT audit_id, correlation_id, actor, action, subject_type, "
    "subject_id, details, created_at "
    "FROM audit_log "
    "WHERE (:symbol IS NULL OR details->>'symbol' = :symbol) "
    "AND (:correlation_id IS NULL OR correlation_id = CAST(:correlation_id "
    "AS UUID)) "
    "ORDER BY created_at DESC "
    "LIMIT :limit"
)
_SELECT_CITATION_COUNTS = text(
    "SELECT subject_id, COUNT(*) AS n FROM evidence_citation "
    "WHERE subject_id = ANY(:subject_ids) GROUP BY subject_id"
)

_DEFAULT_LIMIT = 100


class AuditReader:
    """SELECT-only reader over ``audit_log`` + ``evidence_citation``.

    The reader holds a lazily-created SQLAlchemy :class:`Engine` (reused from
    the pinned Postgres DSN). It never writes; callers get back raw row dicts
    which the read mapper converts to the UI contract.
    """

    def __init__(self, settings: Settings | None = None,
                 engine: Engine | None = None) -> None:
        """Initialize the reader.

        Args:
            settings: Optional settings override (defaults to the cached
                process settings).
            engine: Optional pre-built engine (tests inject a fake/mock; the
                engine is otherwise created lazily on first read).
        """
        self._settings = settings or get_settings()
        self._engine = engine

    def _get_engine(self) -> Engine:
        """Return the engine, creating it lazily from the Postgres DSN.

        Returns:
            The shared SQLAlchemy engine (``pool_pre_ping`` on so a stale
            connection is transparently recycled).
        """
        if self._engine is None:
            self._engine = create_engine(
                self._settings.postgres_dsn, pool_pre_ping=True, future=True)
        return self._engine

    def fetch_records(self, symbol: str | None = None,
                      correlation_id: str | None = None,
                      limit: int = _DEFAULT_LIMIT) -> list[dict[str, Any]]:
        """Fetch audit rows (newest first) with their real citation counts.

        Issues two parameterized SELECTs in one read-only connection: the
        audit rows, then the per-subject citation counts for exactly the
        subjects just read. Returns plain dicts (one per audit row) so the
        mapper — not the reader — owns the UI-contract shaping.

        Args:
            symbol: Optional ticker filter (matched against the non-PII
                ``details.symbol``); ``None`` returns all symbols.
            correlation_id: Optional correlation UUID filter; ``None``
                returns all correlations.
            limit: Max rows to return (newest first). Bounded to a sane
                ceiling to protect the connection.

        Returns:
            A list of row dicts, each carrying the audit columns plus a
            resolved ``citation_count``.
        """
        safe_limit = max(1, min(int(limit), 1000))  # bounds guard
        with self._get_engine().connect() as conn:  # type: Connection
            rows = conn.execute(_SELECT_AUDIT, {
                "symbol": symbol,
                "correlation_id": correlation_id,
                "limit": safe_limit,
            }).mappings().all()
            counts = self._citation_counts(conn, rows)
        records = [self._row_to_dict(r, counts) for r in rows]
        logger.info(
            "audit read returned %d row(s) (symbol=%s correlation_id=%s)",
            len(records), symbol, correlation_id)
        return records

    def _citation_counts(self, conn: Connection,
                         rows: list[Row]) -> dict[Any, int]:
        """Collect citation counts for the subjects in ``rows``.

        Args:
            conn: The active read-only connection.
            rows: The audit rows just fetched (mapping rows).

        Returns:
            A ``subject_id -> count`` map (empty when no row has a subject).
        """
        subject_ids = [r["subject_id"] for r in rows if r["subject_id"]]
        if not subject_ids:
            return {}
        result = conn.execute(_SELECT_CITATION_COUNTS,
                              {"subject_ids": subject_ids})
        return {row.subject_id: int(row.n) for row in result}

    @staticmethod
    def _row_to_dict(row: Any, counts: dict[Any, int]) -> dict[str, Any]:
        """Flatten one audit mapping row into a plain dict for the mapper.

        Args:
            row: One SQLAlchemy mapping row from the audit SELECT.
            counts: The resolved ``subject_id -> citation_count`` map.

        Returns:
            A dict of the row's columns plus ``citation_count``.
        """
        return {
            "audit_id": row["audit_id"],
            "correlation_id": row["correlation_id"],
            "actor": row["actor"],
            "action": row["action"],
            "subject_type": row["subject_type"],
            "subject_id": row["subject_id"],
            "details": row["details"] or {},
            "created_at": row["created_at"],
            "citation_count": counts.get(row["subject_id"], 0),
        }
