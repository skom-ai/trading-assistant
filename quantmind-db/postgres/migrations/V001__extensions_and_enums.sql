-- =====================================================================
-- File: V001__extensions_and_enums.sql
-- Author: Sunil+Ai Assistant
-- Date: 2026-09-07
-- Description: Postgres extensions + all enum types for the QuantMind
--              platform. Runs first; every later migration depends on
--              these enums existing. Idempotent (guarded DO blocks).
-- Source: specs/arch/data/postgres-ddl.sql (STOCK-605)
-- Notes: No PII types exist here by design (FR5.3 / PII-GLBA).
-- =====================================================================

BEGIN;

-- pgcrypto provides gen_random_uuid() used as the default PK generator.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ---------------------------------------------------------------------
-- Enums. Created guarded so re-running the init is safe.
-- ---------------------------------------------------------------------

DO $$ BEGIN
    CREATE TYPE news_verdict_label AS ENUM (
        'REAL_CATALYST', 'ALREADY_PRICED_IN', 'HYPE', 'INSUFFICIENT_EVIDENCE'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE strategy_verdict AS ENUM (
        'BUY', 'WAIT', 'AVOID', 'INSUFFICIENT_EVIDENCE'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE confidence_level AS ENUM ('LOW', 'MEDIUM', 'HIGH');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE factor_name AS ENUM (
        'VALUATION_ZSCORE', 'MOMENTUM_3M', 'MOMENTUM_6M', 'RSI_14', 'VOLUME_TREND'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE catalyst_type AS ENUM (
        'EARNINGS_BEAT', 'EARNINGS_MISS', 'GUIDANCE_RAISE', 'GUIDANCE_CUT',
        'MA_ANNOUNCEMENT', 'PRODUCT_LAUNCH', 'REGULATORY_ACTION',
        'ANALYST_UPGRADE', 'ANALYST_DOWNGRADE', 'MACRO_SECTOR_MOVE', 'OTHER'
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE citation_subject_type AS ENUM ('NEWS_VERDICT', 'STRATEGY_RECOMMENDATION');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE citation_evidence_type AS ENUM ('HEADLINE', 'SCANNER_FACTOR');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

COMMIT;
