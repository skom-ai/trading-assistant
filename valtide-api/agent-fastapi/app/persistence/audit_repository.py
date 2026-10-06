"""Append-only audit + evidence-citation write path (FR5 governance).

File: app/persistence/audit_repository.py
Author: Sunil+Ai Assistant
Date: 2026-10-03
Description:
    AuditRepository owns ALL SQL for the two append-only governance tables
    defined by the V005 migration: ``audit_log`` (SEC 17a-4 reconstruction
    log, details JSONB with NO PII) and ``evidence_citation`` (polymorphic
    claim -> evidence map). It is INSERT-only — it never issues UPDATE or
    DELETE — and every statement is fully parameterized (SQLAlchemy bound
    parameters, no string interpolation), satisfying the SEC/security bar.

    Each scan/news/strategy request records one ``audit_log`` row plus one
    ``evidence_citation`` row per cited evidence id. Audit is an after-the-
    fact record: ``record_request`` wraps the writes and logs-but-swallows
    any failure so a database outage can never alter or break the user-facing
    response (STOCK-504/506 posture).

    DB access reuses the stack already pinned in pyproject.toml — SQLAlchemy
    2.0 Core over the ``postgresql+psycopg`` DSN from Settings — so no new
    dependency is introduced. The engine is created lazily on first write.
Work-item: W3.1
Source: valtide-db/postgres/migrations/V005__evidence_and_audit.sql
        (audit_log, evidence_citation; enums citation_subject_type /
         citation_evidence_type from V001)
"""
from __future__ import annotations

import hashlib
import logging
import uuid
from typing import Any

from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy import Engine, create_engine, text
from sqlalchemy.engine import Connection

from app.core.config import Settings, get_settings
from app.core.logging import get_correlation_id

logger = logging.getLogger(__name__)

# Deterministic namespace for deriving a stable UUID from an opaque string
# evidence id (e.g. "NVDA-h0", "AAPL-fRSI_14"). evidence_citation.evidence_id
# is a UUID column, but the agent's in-flight evidence ids are string tokens;
# uuid5 maps each token to one stable UUID so re-citing the same evidence
# yields the same id (idempotent, auditable) without a schema change.
_EVIDENCE_NS = uuid.UUID("f5f5f5f5-0000-5000-a000-5ec17a4a0d17")

# Parameterized, INSERT-only statements. ":name" are bound parameters — the
# driver sends values out-of-band, so no caller input is ever interpolated.
_INSERT_AUDIT = text(
    "INSERT INTO audit_log "
    "(correlation_id, actor, action, subject_type, subject_id, details) "
    "VALUES (:correlation_id, :actor, :action, :subject_type, :subject_id, "
    "CAST(:details AS JSONB)) RETURNING audit_id"
)
_INSERT_CITATION = text(
    "INSERT INTO evidence_citation "
    "(subject_type, subject_id, evidence_type, evidence_id, content_hash) "
    "VALUES (CAST(:subject_type AS citation_subject_type), :subject_id, "
    "CAST(:evidence_type AS citation_evidence_type), :evidence_id, "
    ":content_hash)"
)


class EvidenceRef(BaseModel):
    """One cited piece of evidence to persist as an ``evidence_citation`` row.

    Attributes:
        evidence_type: Enum value accepted by ``citation_evidence_type``
            (``HEADLINE`` or ``SCANNER_FACTOR``).
        evidence_id: The opaque in-flight evidence id (string token). It is
            mapped to a stable UUID at write time via uuid5.
        content_hash: Precomputed content hash, or ``None`` to derive a
            sha256 over the raw ``evidence_id`` (never over PII).
    """

    model_config = ConfigDict(extra="forbid")

    evidence_type: str
    evidence_id: str
    content_hash: str | None = None


class AuditRecord(BaseModel):
    """A single append-only audit event plus its cited evidence.

    ``details`` is a NON-PII summary (symbol, verdict/label, model,
    weight_version, latency). The repository additionally stamps the active
    ``correlation_id`` into ``details`` so the row is self-describing.

    Attributes:
        actor: ``"system"`` or an opaque session token (never a name/email).
        action: Request action, e.g. ``FR1_NEWS_CHECK`` / ``FR2_SCAN`` /
            ``FR3_STRATEGY``.
        subject_type: Enum value for ``citation_subject_type`` when evidence
            is cited (``NEWS_VERDICT`` / ``STRATEGY_RECOMMENDATION``); may be
            ``None`` for subject-less actions (e.g. a scan).
        subject_id: The subject's stable id (string token mapped to UUID), or
            ``None``.
        details: Non-PII JSONB summary payload.
        evidence: Cited evidence refs -> one citation row each.
    """

    model_config = ConfigDict(extra="forbid")

    actor: str = "system"
    action: str
    subject_type: str | None = None
    subject_id: str | None = None
    details: dict[str, Any] = Field(default_factory=dict)
    evidence: list[EvidenceRef] = Field(default_factory=list)


def _stable_uuid(token: str | None) -> uuid.UUID | None:
    """Map an opaque string token to a stable UUID (uuid5), or pass through.

    Args:
        token: An in-flight string id, an existing UUID string, or ``None``.

    Returns:
        A deterministic UUID for the token, the parsed UUID if it already is
        one, or ``None`` when ``token`` is ``None``.
    """
    if token is None:
        return None
    try:
        return uuid.UUID(str(token))
    except (ValueError, AttributeError, TypeError):
        return uuid.uuid5(_EVIDENCE_NS, str(token))


def _sha256(value: str) -> str:
    """Return the hex sha256 of ``value`` (used for content_hash).

    Args:
        value: Non-PII content to hash (here, the evidence id token).

    Returns:
        A 64-char lowercase hex digest (fits ``VARCHAR(64)``).
    """
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


class AuditRepository:
    """Append-only writer for ``audit_log`` and ``evidence_citation``.

    The repository holds a lazily-created SQLAlchemy :class:`Engine`. Callers
    use :meth:`record_request` after producing their result; its writes are
    failure-isolated so an audit outage never breaks the request.
    """

    def __init__(self, settings: Settings | None = None,
                 engine: Engine | None = None) -> None:
        """Initialize the repository.

        Args:
            settings: Optional settings override (defaults to the cached
                process settings).
            engine: Optional pre-built engine (tests inject a fake/mock; the
                engine is otherwise created lazily on first write).
        """
        self._settings = settings or get_settings()
        self._engine = engine

    def _get_engine(self) -> Engine:
        """Return the engine, creating it lazily from the Postgres DSN.

        Returns:
            The shared SQLAlchemy engine (``pool_pre_ping`` on, so a stale
            connection is transparently recycled).
        """
        if self._engine is None:
            self._engine = create_engine(
                self._settings.postgres_dsn, pool_pre_ping=True, future=True)
        return self._engine

    def record_request(self, record: AuditRecord) -> uuid.UUID | None:
        """Persist one audit event + its citations; swallow any failure.

        This is the ONLY method the service flows call. Audit is an
        after-the-fact record, so a write failure is logged (ERROR, with the
        correlation id) and absorbed — it is NEVER propagated to the caller
        and therefore cannot alter the user-facing response.

        Args:
            record: The audit event to append.

        Returns:
            The new ``audit_id`` on success, or ``None`` when the write failed
            (and was logged).
        """
        try:
            return self._write(record)
        except Exception:  # noqa: BLE001 — isolation is the whole point.
            logger.error(
                "audit write failed (correlation_id=%s action=%s); "
                "request response is unaffected",
                get_correlation_id(), record.action, exc_info=True)
            return None

    def _write(self, record: AuditRecord) -> uuid.UUID:
        """Execute the append-only writes in one transaction.

        Stamps the active ``correlation_id`` into ``details`` (non-PII) and
        inserts the ``audit_log`` row, then one ``evidence_citation`` row per
        cited evidence id. All statements are parameterized and INSERT-only.

        Args:
            record: The audit event to append.

        Returns:
            The new ``audit_id``.
        """
        correlation_id = get_correlation_id()
        details = dict(record.details)
        details.setdefault("correlation_id", correlation_id)
        import json

        subject_uuid = _stable_uuid(record.subject_id)
        with self._get_engine().begin() as conn:  # type: Connection
            audit_id = conn.execute(_INSERT_AUDIT, {
                "correlation_id": correlation_id,
                "actor": record.actor,
                "action": record.action,
                "subject_type": record.subject_type,
                "subject_id": subject_uuid,
                "details": json.dumps(details, default=str),
            }).scalar_one()
            if record.subject_type and subject_uuid is not None:
                self._write_citations(conn, record, subject_uuid)
        logger.info("audit row %s written (action=%s, citations=%d)",
                    audit_id, record.action, len(record.evidence))
        return audit_id

    def _write_citations(self, conn: Connection, record: AuditRecord,
                         subject_uuid: uuid.UUID) -> None:
        """Insert one ``evidence_citation`` row per cited evidence id.

        Args:
            conn: The active (transactional) connection.
            record: The audit event carrying the evidence refs.
            subject_uuid: The subject's stable UUID (links citation->subject).
        """
        for ev in record.evidence:
            conn.execute(_INSERT_CITATION, {
                "subject_type": record.subject_type,
                "subject_id": subject_uuid,
                "evidence_type": ev.evidence_type,
                "evidence_id": _stable_uuid(ev.evidence_id),
                "content_hash": ev.content_hash or _sha256(ev.evidence_id),
            })
