-- =====================================================================
-- File: V006__roles_and_grants.sql
-- Author: Sunil+Ai Assistant
-- Date: 2026-09-07
-- Description: Least-privilege database roles (STOCK-605-T3). The app
--              service connects as app_readwrite; compliance
--              reconstruction uses app_audit_readonly. Neither role may
--              DELETE from the append-only audit_log / evidence_citation.
-- Source: specs/arch/data/postgres-ddl.sql
-- Notes: Roles are NOLOGIN groups; the concrete login user (quantmind)
--        is GRANTed membership by the entrypoint script.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- app_readwrite — the application service role
-- ---------------------------------------------------------------------
DO $$ BEGIN
    CREATE ROLE app_readwrite NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO app_readwrite;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_readwrite;

-- Append-only enforcement: no DELETE on the recordkeeping tables.
REVOKE DELETE ON audit_log, evidence_citation FROM app_readwrite;

-- ---------------------------------------------------------------------
-- app_audit_readonly — compliance reconstruction only (threat model T-06)
-- ---------------------------------------------------------------------
DO $$ BEGIN
    CREATE ROLE app_audit_readonly NOLOGIN;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_audit_readonly;

-- Ensure future tables inherit the same grants.
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT, INSERT, UPDATE ON TABLES TO app_readwrite;
ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO app_audit_readonly;

COMMIT;
