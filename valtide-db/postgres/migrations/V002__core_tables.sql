-- =====================================================================
-- File: V002__core_tables.sql
-- Author: Sunil+Ai Assistant
-- Date: 2026-09-07
-- Description: Core relational entities — the master symbol table, the
--              externally-configured scan universe, retrieved news
--              headlines, and LLM-produced news verdicts (FR1).
-- Source: specs/arch/data/postgres-ddl.sql (STOCK-101/102/105/201)
-- Notes: All timestamps are TIMESTAMPTZ (UTC). content_hash columns are
--        SHA-256 hex, tamper-evident. No PII columns (FR5.3).
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- ticker — master symbol table (STOCK-101-T3)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticker (
    ticker_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    symbol          VARCHAR(10) NOT NULL UNIQUE
                        CHECK (symbol ~ '^[A-Z.\-]{1,10}$'),
    exchange        VARCHAR(20),
    company_name    VARCHAR(200),
    is_resolvable   BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------
-- ticker_universe — externally-configured scan universe (STOCK-201)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ticker_universe (
    universe_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker_id       UUID NOT NULL REFERENCES ticker(ticker_id) ON DELETE RESTRICT,
    version         INTEGER NOT NULL,
    active          BOOLEAN NOT NULL DEFAULT true,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by      VARCHAR(100) NOT NULL,
    UNIQUE (ticker_id, version)
);
CREATE INDEX IF NOT EXISTS idx_ticker_universe_active
    ON ticker_universe (active, version);

-- ---------------------------------------------------------------------
-- headline — retrieved news items (STOCK-102-T4)
-- content_hash = SHA-256 of (title+url+published_at) — tamper-evident.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS headline (
    headline_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker_id       UUID NOT NULL REFERENCES ticker(ticker_id) ON DELETE CASCADE,
    source          VARCHAR(100) NOT NULL,
    title           TEXT NOT NULL,
    url             TEXT NOT NULL,
    published_at    TIMESTAMPTZ NOT NULL,
    retrieved_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
    content_hash    VARCHAR(64) NOT NULL,
    UNIQUE (ticker_id, url)
);
CREATE INDEX IF NOT EXISTS idx_headline_ticker_published
    ON headline (ticker_id, published_at DESC);

-- ---------------------------------------------------------------------
-- news_verdict — FR1 classification output (STOCK-105-T1)
-- Persists the full reproducibility envelope: model, prompt_version,
-- temperature, input_hash, correlation_id.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS news_verdict (
    verdict_id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker_id        UUID NOT NULL REFERENCES ticker(ticker_id) ON DELETE CASCADE,
    label            news_verdict_label NOT NULL,
    rationale        TEXT NOT NULL,
    confidence_hint  VARCHAR(20),
    model            VARCHAR(100) NOT NULL,
    prompt_version   VARCHAR(20) NOT NULL,
    temperature      NUMERIC(3,2) NOT NULL,
    input_hash       VARCHAR(64) NOT NULL,
    correlation_id   UUID NOT NULL,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_news_verdict_ticker
    ON news_verdict (ticker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_news_verdict_correlation
    ON news_verdict (correlation_id);

COMMIT;
