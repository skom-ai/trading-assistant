"""Unit tests for the append-only AuditRepository + mapper (W3.1).

File: tests/test_audit_repository.py
Author: Sunil+Ai Assistant
Date: 2026-10-03
Description:
    Verifies the FR5 governance write path WITHOUT a live Postgres (a fake
    connection/engine captures every statement + bound-parameter set). The
    tests assert the three governance invariants:
      1. The SQL is INSERT-only and parameterized (no UPDATE/DELETE, no
         string-interpolated values) for BOTH audit_log and evidence_citation.
      2. The audit details carry NO PII and DO include the correlation_id.
      3. A failed audit write is swallowed — it never propagates to the caller.
    Also covers the result-dict -> AuditRecord mappers for FR1/FR2/FR3.
Work-item: W3.1
Source: valtide-db/postgres/migrations/V005__evidence_and_audit.sql
"""
from __future__ import annotations

import uuid

from app.core.logging import set_correlation_id
from app.persistence import audit_mapper
from app.persistence.audit_repository import (
    AuditRecord,
    AuditRepository,
    EvidenceRef,
)


class _FakeResult:
    """Minimal result stub returning a fixed audit_id from scalar_one()."""

    def __init__(self, value: uuid.UUID) -> None:
        self._value = value

    def scalar_one(self) -> uuid.UUID:
        """Return the canned audit_id."""
        return self._value


class _FakeConn:
    """Captures every (statement_text, params) pair passed to execute()."""

    def __init__(self, audit_id: uuid.UUID) -> None:
        self.audit_id = audit_id
        self.calls: list[tuple[str, dict]] = []

    def execute(self, stmt, params):  # type: ignore[no-untyped-def]
        """Record the compiled SQL text + params; return a fake result."""
        self.calls.append((str(stmt), dict(params)))
        return _FakeResult(self.audit_id)

    def __enter__(self) -> "_FakeConn":
        return self

    def __exit__(self, *exc) -> bool:  # type: ignore[no-untyped-def]
        return False


class _FakeEngine:
    """Engine stub whose begin() yields a single shared _FakeConn."""

    def __init__(self, conn: _FakeConn) -> None:
        self._conn = conn

    def begin(self) -> _FakeConn:
        """Return the transactional fake connection (context manager)."""
        return self._conn


class _BoomEngine:
    """Engine stub that raises on begin() to simulate a DB outage."""

    def begin(self):  # type: ignore[no-untyped-def]
        """Raise as if the database were unreachable."""
        raise RuntimeError("postgres unreachable")


def _repo(engine) -> AuditRepository:  # type: ignore[no-untyped-def]
    """Build a repository bound to an injected fake engine."""
    return AuditRepository(engine=engine)


def _record() -> AuditRecord:
    """A representative FR1 audit record with two HEADLINE citations."""
    return AuditRecord(
        action="FR1_NEWS_CHECK", subject_type="NEWS_VERDICT",
        subject_id="NVDA-news",
        details={"symbol": "NVDA", "label": "REAL_CATALYST",
                 "model": "gemini-3.6-flash", "latency_ms": 12.3},
        evidence=[EvidenceRef(evidence_type="HEADLINE", evidence_id="NVDA-h0",
                              content_hash="a" * 64),
                  EvidenceRef(evidence_type="HEADLINE", evidence_id="NVDA-h1")],
    )


def test_writes_are_insert_only() -> None:
    """Every statement is an INSERT — never UPDATE/DELETE (append-only)."""
    conn = _FakeConn(uuid.uuid4())
    _repo(_FakeEngine(conn)).record_request(_record())
    assert conn.calls, "expected at least the audit_log insert"
    for sql, _ in conn.calls:
        upper = sql.upper()
        assert upper.lstrip().startswith("INSERT")
        assert "UPDATE " not in upper and "DELETE " not in upper


def test_both_tables_written_parameterized() -> None:
    """audit_log + one evidence_citation per cited id, all parameterized."""
    conn = _FakeConn(uuid.uuid4())
    _repo(_FakeEngine(conn)).record_request(_record())
    tables = [sql for sql, _ in conn.calls]
    assert any("audit_log" in s for s in tables)
    assert sum("evidence_citation" in s for s in tables) == 2  # two citations
    # Parameterized: statements use ":name" bind params, values ride in params.
    for sql, params in conn.calls:
        assert ":" in sql  # bound-parameter markers present
        assert params  # values supplied out-of-band, not interpolated


def test_details_has_no_pii_and_includes_correlation_id() -> None:
    """details carries the non-PII summary + correlation_id, and no PII keys."""
    set_correlation_id("corr-xyz-123")
    conn = _FakeConn(uuid.uuid4())
    _repo(_FakeEngine(conn)).record_request(_record())
    audit_sql, audit_params = next(
        (s, p) for s, p in conn.calls if "audit_log" in s)
    assert audit_params["correlation_id"] == "corr-xyz-123"
    # details is serialized JSON text; it must embed the correlation id and
    # only non-PII summary fields (symbol/label/model/latency), never a
    # name/email/user identifier.
    details_json = audit_params["details"]
    assert "corr-xyz-123" in details_json
    assert "NVDA" in details_json and "REAL_CATALYST" in details_json
    for pii in ("email", "@", "ssn", "first_name", "last_name", "phone"):
        assert pii not in details_json.lower()
    assert audit_params["actor"] == "system"  # opaque actor, never a person


def test_failed_write_does_not_propagate() -> None:
    """A DB outage is swallowed (logged) — record_request returns None."""
    out = _repo(_BoomEngine()).record_request(_record())
    assert out is None  # caller sees no exception; response is unaffected


def test_scan_record_has_no_citations_and_no_pii() -> None:
    """FR2 scan audits weight_version/latency with zero citation rows."""
    conn = _FakeConn(uuid.uuid4())
    rec = audit_mapper.for_scan(
        {"weight_version": 1, "universe_size": 80, "rows": [1, 2, 3]}, 9.9)
    _repo(_FakeEngine(conn)).record_request(rec)
    assert rec.action == "FR2_SCAN" and not rec.evidence
    assert all("evidence_citation" not in sql for sql, _ in conn.calls)


def test_news_mapper_extracts_headline_citations() -> None:
    """FR1 mapper -> NEWS_VERDICT subject + one HEADLINE ref per citation."""
    result = {"label": "HYPE",
              "citations": [{"id": "AAPL-h0", "hash": "f" * 64},
                            {"id": "AAPL-h1"}]}
    rec = audit_mapper.for_news("AAPL", result, "gemini-3.6-flash", 5.0)
    assert rec.subject_type == "NEWS_VERDICT"
    assert [e.evidence_type for e in rec.evidence] == ["HEADLINE", "HEADLINE"]
    assert rec.details["label"] == "HYPE" and rec.details["model"]


def test_strategy_mapper_extracts_factor_citations() -> None:
    """FR3 mapper -> STRATEGY_RECOMMENDATION + SCANNER_FACTOR refs."""
    result = {"strategy": {"verdict": "BUY",
                           "cited_evidence_ids": ["NVDA-fRSI_14", "NVDA-fMOM"]}}
    rec = audit_mapper.for_strategy("NVDA", result, "gemini-3.6-flash", 7.0)
    assert rec.subject_type == "STRATEGY_RECOMMENDATION"
    assert {e.evidence_type for e in rec.evidence} == {"SCANNER_FACTOR"}
    assert rec.details["verdict"] == "BUY"


def test_lazy_engine_built_from_dsn() -> None:
    """With no injected engine, the DSN-built engine is created once (cached)."""
    repo = AuditRepository()
    eng1 = repo._get_engine()
    eng2 = repo._get_engine()
    assert eng1 is eng2  # lazily created, then memoized
