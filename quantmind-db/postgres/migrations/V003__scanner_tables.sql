-- =====================================================================
-- File: V003__scanner_tables.sql
-- Author: Sunil+Ai Assistant
-- Date: 2026-09-07
-- Description: FR2 deterministic scanner entities — one row per scan
--              execution, the four raw factor values per ticker (the
--              auditable evidence), and the resulting top-10 ranking.
-- Source: specs/arch/data/postgres-ddl.sql (STOCK-202/203)
-- Notes: Raw factor values are PERSISTED (not intermediate) — they are
--        the compliance evidence for the ranking. NUMERIC only.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- scanner_run — groups one scan execution
-- initiated_by is an opaque session token, never an identity (FR5.3).
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scanner_run (
    scan_run_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    universe_version  INTEGER NOT NULL,
    weight_version    INTEGER NOT NULL,
    initiated_by      VARCHAR(100) NOT NULL,
    started_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at      TIMESTAMPTZ,
    duration_ms       INTEGER
);

-- ---------------------------------------------------------------------
-- scanner_factor — four raw factor values per ticker per run (STOCK-202-T5)
-- value is nullable: e.g. VALUATION_ZSCORE excluded for negative-earnings
-- tickers, MOMENTUM_6M excluded when history < 6 months.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scanner_factor (
    factor_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_run_id       UUID NOT NULL REFERENCES scanner_run(scan_run_id) ON DELETE CASCADE,
    ticker_id         UUID NOT NULL REFERENCES ticker(ticker_id) ON DELETE CASCADE,
    factor_name       factor_name NOT NULL,
    value             NUMERIC(18,6),
    computed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    data_provenance   VARCHAR(200) NOT NULL,
    UNIQUE (scan_run_id, ticker_id, factor_name)
);
CREATE INDEX IF NOT EXISTS idx_scanner_factor_run
    ON scanner_factor (scan_run_id);

-- ---------------------------------------------------------------------
-- scanner_ranking — deterministic top-10 for a run (STOCK-203-T4)
-- rank is 1..10; composite_score reproducible for the input snapshot.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scanner_ranking (
    ranking_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scan_run_id       UUID NOT NULL REFERENCES scanner_run(scan_run_id) ON DELETE CASCADE,
    ticker_id         UUID NOT NULL REFERENCES ticker(ticker_id) ON DELETE CASCADE,
    rank              INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 10),
    composite_score   NUMERIC(10,6) NOT NULL,
    weight_version    INTEGER NOT NULL,
    UNIQUE (scan_run_id, rank)
);
CREATE INDEX IF NOT EXISTS idx_scanner_ranking_run
    ON scanner_ranking (scan_run_id);

COMMIT;
