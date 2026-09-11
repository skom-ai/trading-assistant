-- =====================================================================
-- File: V004__strategy_analog_tables.sql
-- Author: Sunil+Ai Assistant
-- Date: 2026-09-07
-- Description: FR3 strategy recommendations (with numeric-coherence
--              CHECK constraint), FR4 curated historical analog cases,
--              and the analog matches linking a strategy to its top-N
--              precedents.
-- Source: specs/arch/data/postgres-ddl.sql (STOCK-302/401/403)
-- Notes: chk_long_buy_coherence enforces stop < entry < target for BUY
--        at the DB level — defense in depth behind CoherenceValidator.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- strategy_recommendation — FR3 output (STOCK-302-T4)
-- source_verdict_id / source_ranking_id: mutually optional — a strategy
-- may originate from FR1 (news) or FR2 (scanner) context.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS strategy_recommendation (
    strategy_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker_id             UUID NOT NULL REFERENCES ticker(ticker_id) ON DELETE CASCADE,
    source_verdict_id     UUID REFERENCES news_verdict(verdict_id) ON DELETE SET NULL,
    source_ranking_id     UUID REFERENCES scanner_ranking(ranking_id) ON DELETE SET NULL,
    verdict               strategy_verdict NOT NULL,
    entry                 NUMERIC(14,4),
    target                NUMERIC(14,4),
    stop                  NUMERIC(14,4),
    holding_horizon       VARCHAR(50),
    confidence            confidence_level NOT NULL,
    rationale             TEXT NOT NULL,
    applicability_flags   JSONB NOT NULL DEFAULT '{}'::jsonb,
    model                 VARCHAR(100) NOT NULL,
    prompt_version        VARCHAR(20) NOT NULL,
    temperature           NUMERIC(3,2) NOT NULL,
    input_hash            VARCHAR(64) NOT NULL,
    correlation_id        UUID NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT chk_long_buy_coherence CHECK (
        verdict <> 'BUY' OR (entry IS NOT NULL AND target IS NOT NULL AND stop IS NOT NULL
                              AND stop < entry AND entry < target)
    )
);
CREATE INDEX IF NOT EXISTS idx_strategy_ticker
    ON strategy_recommendation (ticker_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_strategy_correlation
    ON strategy_recommendation (correlation_id);

-- ---------------------------------------------------------------------
-- historical_analog_case — curated dataset (STOCK-401-T1)
-- setup_tags: JSON array of strings. key_factors_at_time: factor snapshot.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS historical_analog_case (
    case_id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticker                VARCHAR(10) NOT NULL,
    case_date             DATE NOT NULL,
    catalyst_type         catalyst_type NOT NULL,
    setup_tags            JSONB NOT NULL DEFAULT '[]'::jsonb,
    key_factors_at_time   JSONB NOT NULL,
    real_outcome          TEXT NOT NULL,
    outcome_window        VARCHAR(50) NOT NULL,
    source_reference      TEXT NOT NULL,
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_analog_case_catalyst
    ON historical_analog_case (catalyst_type);

-- ---------------------------------------------------------------------
-- analog_match — top-1..3 precedents for a strategy (STOCK-403-T2)
-- similarity_score in [0,1]; case_id RESTRICT so curated cases are not
-- silently removed while referenced.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS analog_match (
    match_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    strategy_id       UUID NOT NULL REFERENCES strategy_recommendation(strategy_id) ON DELETE CASCADE,
    case_id           UUID NOT NULL REFERENCES historical_analog_case(case_id) ON DELETE RESTRICT,
    similarity_score  NUMERIC(6,5) NOT NULL CHECK (similarity_score BETWEEN 0 AND 1),
    match_reason      TEXT NOT NULL,
    rank              INTEGER NOT NULL CHECK (rank BETWEEN 1 AND 3),
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (strategy_id, rank)
);

COMMIT;
