-- =====================================================================
-- File: V005__evidence_and_audit.sql
-- Author: Sunil+Ai Assistant
-- Date: 2026-09-07
-- Description: FR5 cross-cutting persistence — the polymorphic evidence
--              citation store (every user-facing claim traces to a row
--              here) and the append-only audit log (SEC 17a-4 posture).
-- Source: specs/arch/data/postgres-ddl.sql (STOCK-501/506)
-- Notes: Polymorphic FKs are intentionally NOT DB-enforced; integrity is
--        guaranteed by the TraceabilityGate app service before write and
--        verified in integration tests (TC-FR5-U01). audit_log.details
--        must contain no PII (STOCK-504).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- evidence_citation — polymorphic (STOCK-501-T1)
-- subject_id  -> news_verdict OR strategy_recommendation
-- evidence_id -> headline OR scanner_factor
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS evidence_citation (
    citation_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_type      citation_subject_type NOT NULL,
    subject_id        UUID NOT NULL,
    evidence_type     citation_evidence_type NOT NULL,
    evidence_id       UUID NOT NULL,
    content_hash      VARCHAR(64) NOT NULL,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_citation_subject
    ON evidence_citation (subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_citation_evidence
    ON evidence_citation (evidence_type, evidence_id);

-- ---------------------------------------------------------------------
-- audit_log — append-only reconstruction log (STOCK-506-T2)
-- actor is an opaque session token or "system"; details holds no PII.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit_log (
    audit_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    correlation_id    UUID NOT NULL,
    actor             VARCHAR(100) NOT NULL,
    action            VARCHAR(100) NOT NULL,
    subject_type      VARCHAR(50),
    subject_id        UUID,
    details           JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_correlation
    ON audit_log (correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_created
    ON audit_log (created_at DESC);

COMMIT;
