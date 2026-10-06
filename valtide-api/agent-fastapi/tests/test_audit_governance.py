"""Unit tests for the FR5 governance READ path (W3.2).

File: tests/test_audit_governance.py
Author: Sunil+Ai Assistant
Date: 2026-10-03
Description:
    Verifies the governance read path WITHOUT a live Postgres (a fake
    connection captures each SELECT + its bound params and returns canned
    rows). Asserts:
      1. The reader issues SELECT-only, parameterized SQL (no write verbs)
         and applies the symbol/correlation filters as bound params.
      2. The read mapper maps rows -> AuditLedgerRecord with a REAL,
         deterministic merkleHash: the same row hashes identically, a
         changed row hashes differently.
      3. The governance response carries the records + a canonical SEC-17a-4
         bundle whose merkle root equals the newest record's real hash and
         whose claim count is the row's real citation count (no fabrication).
Work-item: W3.2
Source: valtide-db/postgres/migrations/V005__evidence_and_audit.sql,
        valtide-ui/src/types.ts (AuditLedgerRecord)
"""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Any

from app.persistence import audit_read_mapper
from app.persistence.audit_reader import AuditReader


class _CitationRow:
    """Row stub for the citation-count SELECT (attribute access)."""

    def __init__(self, subject_id: Any, n: int) -> None:
        self.subject_id = subject_id
        self.n = n


class _FakeResult:
    """Result stub exposing .mappings().all() and iteration (counts)."""

    def __init__(self, rows: list[Any], as_mappings: bool) -> None:
        self._rows = rows
        self._as_mappings = as_mappings

    def mappings(self) -> "_FakeResult":
        """Return self (rows are already dict-like mapping rows)."""
        return self

    def all(self) -> list[Any]:
        """Return the canned rows."""
        return self._rows

    def __iter__(self):  # type: ignore[no-untyped-def]
        """Iterate rows (used by the citation-count collector)."""
        return iter(self._rows)


class _FakeConn:
    """Captures each (sql, params); returns audit rows then citation counts."""

    def __init__(self, audit_rows: list[dict], counts: list[_CitationRow]) -> None:
        self._audit_rows = audit_rows
        self._counts = counts
        self.calls: list[tuple[str, dict]] = []

    def execute(self, stmt, params):  # type: ignore[no-untyped-def]
        """Record the statement + params; dispatch by target table."""
        sql = str(stmt)
        self.calls.append((sql, dict(params)))
        if "evidence_citation" in sql:
            return _FakeResult(self._counts, as_mappings=False)
        return _FakeResult(self._audit_rows, as_mappings=True)

    def __enter__(self) -> "_FakeConn":
        return self

    def __exit__(self, *exc) -> bool:  # type: ignore[no-untyped-def]
        return False


class _FakeEngine:
    """Engine stub whose connect() yields a single shared _FakeConn."""

    def __init__(self, conn: _FakeConn) -> None:
        self._conn = conn

    def connect(self) -> _FakeConn:
        """Return the read-only fake connection (context manager)."""
        return self._conn


_SUBJECT = uuid.uuid4()
_CREATED = datetime(2025, 5, 18, 14, 32, 9, tzinfo=timezone.utc)


def _audit_row(**over: Any) -> dict[str, Any]:
    """A representative FR3 audit row (mapping-row-like dict)."""
    base: dict[str, Any] = {
        "audit_id": uuid.UUID("11111111-1111-5111-8111-111111111111"),
        "correlation_id": uuid.UUID("c08e4f1a-7b92-4f21-a39c-1982bde94a02"),
        "actor": "system",
        "action": "FR3_STRATEGY",
        "subject_type": "STRATEGY_RECOMMENDATION",
        "subject_id": _SUBJECT,
        "details": {"symbol": "NVDA", "verdict": "BUY",
                    "model": "gemini-3.6-flash", "latency_ms": 18.4},
        "created_at": _CREATED,
    }
    base.update(over)
    return base


def _reader(rows: list[dict], counts: list[_CitationRow]) -> tuple[AuditReader, _FakeConn]:
    """Build a reader bound to a fake engine returning the given rows."""
    conn = _FakeConn(rows, counts)
    return AuditReader(engine=_FakeEngine(conn)), conn


def test_reader_is_select_only_and_parameterized() -> None:
    """Every statement is a SELECT — never INSERT/UPDATE/DELETE."""
    reader, conn = _reader([_audit_row()], [_CitationRow(_SUBJECT, 2)])
    reader.fetch_records()
    assert conn.calls, "expected at least the audit SELECT"
    for sql, params in conn.calls:
        upper = sql.upper()
        assert upper.lstrip().startswith("SELECT")
        for verb in ("INSERT ", "UPDATE ", "DELETE ", "DROP "):
            assert verb not in upper
        assert ":" in sql  # bound-parameter markers present


def test_reader_passes_filters_as_bound_params() -> None:
    """symbol/correlation/limit ride as bound params on the audit SELECT."""
    reader, conn = _reader([_audit_row()], [_CitationRow(_SUBJECT, 1)])
    reader.fetch_records(symbol="NVDA", correlation_id="c08e4f1a-7b92-4f21-"
                         "a39c-1982bde94a02", limit=25)
    audit_params = next(p for s, p in conn.calls if "audit_log" in s)
    assert audit_params["symbol"] == "NVDA"
    assert audit_params["correlation_id"].startswith("c08e4f1a")
    assert audit_params["limit"] == 25


def test_reader_resolves_real_citation_count() -> None:
    """The row's citation_count comes from the citation-count SELECT."""
    reader, _ = _reader([_audit_row()], [_CitationRow(_SUBJECT, 3)])
    rows = reader.fetch_records()
    assert rows[0]["citation_count"] == 3


def test_reader_limit_is_bounded() -> None:
    """An out-of-range limit is clamped (connection protection)."""
    reader, conn = _reader([_audit_row()], [])
    reader.fetch_records(limit=10_000)
    audit_params = next(p for s, p in conn.calls if "audit_log" in s)
    assert audit_params["limit"] == 1000


def test_mapper_maps_row_to_ledger_record_shape() -> None:
    """Row -> AuditLedgerRecord with the exact UI contract field names."""
    rec = audit_read_mapper.to_ledger_record(_audit_row())
    data = rec.model_dump()
    assert set(data) == {"traceId", "event", "symbol", "pipeline",
                         "merkleHash", "status", "timestamp",
                         "initiatingEntity", "latencyMs"}
    assert data["symbol"] == "NVDA"
    assert data["event"] == "STOCK-300: Strategy Studio"
    assert data["status"] == "BUY"  # from persisted verdict
    assert data["latencyMs"] == 18.4
    assert data["timestamp"] == "2025-05-18 14:32:09 UTC"
    assert data["initiatingEntity"] == "system"


def test_merkle_hash_is_real_sha256_and_deterministic() -> None:
    """Same row => same hash; different row => different hash. No randomness."""
    row = _audit_row()
    h1 = audit_read_mapper.merkle_hash(row)
    h2 = audit_read_mapper.merkle_hash(_audit_row())  # equal content
    assert h1 == h2  # deterministic
    assert h1.startswith("0x") and len(h1) == 66  # 0x + 64 hex chars
    # A change to ANY persisted field changes the hash.
    changed = _audit_row(details={"symbol": "AAPL", "verdict": "BUY",
                                  "model": "gemini-3.6-flash",
                                  "latency_ms": 18.4})
    assert audit_read_mapper.merkle_hash(changed) != h1
    # The mapped record's hash matches the standalone computation.
    assert audit_read_mapper.to_ledger_record(row).merkleHash == h1


def test_governance_response_records_and_canonical_bundle() -> None:
    """Response carries records + a bundle anchored to the newest real hash."""
    newest = _audit_row()
    older = _audit_row(
        audit_id=uuid.UUID("22222222-2222-5222-8222-222222222222"),
        action="FR1_NEWS_CHECK", subject_type="NEWS_VERDICT",
        details={"symbol": "IONQ", "label": "HYPE", "latency_ms": 9.1})
    newest["citation_count"] = 2
    older["citation_count"] = 1
    resp = audit_read_mapper.to_governance_response([newest, older])
    assert len(resp.records) == 2
    assert resp.correlationUuid.startswith("c08e4f1a")
    bundle = resp.canonicalBundle
    # Merkle root in the bundle equals the newest record's REAL hash.
    assert bundle["provenance_merkle_root"] == resp.records[0].merkleHash
    assert bundle["symbol"] == "NVDA"
    assert bundle["schema_version"] == "SEC_17a4_v4.2"
    # Claim count is the row's REAL citation count, not fabricated.
    assert bundle["claims_verified_count"] == 2
    assert bundle["finra_rule_2210"]["promissory_language_detected"] is False


def test_governance_response_empty_when_no_rows() -> None:
    """No rows => empty records, empty bundle, empty correlation uuid."""
    resp = audit_read_mapper.to_governance_response([])
    assert resp.records == [] and resp.canonicalBundle == {}
    assert resp.correlationUuid == ""


def test_reader_no_subjects_skips_citation_query() -> None:
    """A subject-less scan row issues no citation-count SELECT."""
    scan_row = _audit_row(action="FR2_SCAN", subject_type=None,
                          subject_id=None,
                          details={"symbol": "", "latency_ms": 5.0})
    reader, conn = _reader([scan_row], [])
    rows = reader.fetch_records()
    assert rows[0]["citation_count"] == 0
    assert all("evidence_citation" not in sql for sql, _ in conn.calls)


def test_lazy_engine_built_from_dsn() -> None:
    """With no injected engine, the DSN-built engine is created once."""
    reader = AuditReader()
    assert reader._get_engine() is reader._get_engine()


def test_timestamp_handles_naive_and_missing_created_at() -> None:
    """A naive datetime is treated as UTC; a non-datetime yields ''."""
    naive = _audit_row(created_at=datetime(2025, 5, 18, 14, 32, 9))  # no tz
    assert audit_read_mapper.to_ledger_record(naive).timestamp == (
        "2025-05-18 14:32:09 UTC")
    missing = _audit_row(created_at=None)
    assert audit_read_mapper.to_ledger_record(missing).timestamp == ""

