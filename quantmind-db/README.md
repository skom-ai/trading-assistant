# QuantMind DB — Data Layer

**Component:** `quantmind-db` | **Part of:** AI Stock Opportunity Discovery & Strategy Platform
**Source of truth:** `../specs/arch/data/postgres-ddl.sql`, `../specs/arch/data/mongodb-collections.md`, `../specs/arch/data/redis-keyspace.md`, `../specs/arch/diagrams/07-erd-postgres.mmd`

This folder holds the persistence layer for the platform: **PostgreSQL** (relational system of record),
**Redis** (session / cache / rate-limit, ephemeral), and **MongoDB** (LLM prompt/response traces, audit-only).
Everything here is container-first and deployed to a local Docker instance via the root `docker-compose.yml`.

## Design invariants (from HLD/SDD/DDD)

- **No PII anywhere by design** (FR5.3 / PII-GLBA). No column, key, or document may hold a name, email, or account number.
- **Monetary/price values use `NUMERIC`, never `FLOAT`** — avoids rounding drift in coherence validation.
- **`audit_log` and `evidence_citation` are append-only** for the app role (no `DELETE`) — SEC 17a-4 recordkeeping posture.
- **Least-privilege roles:** `app_readwrite` (app service) and `app_audit_readonly` (compliance reconstruction only).

## Layout

```
quantmind-db/
├── postgres/
│   ├── migrations/          # Versioned, ordered, idempotent SQL migrations (V001…)
│   │   ├── V001__extensions_and_enums.sql
│   │   ├── V002__core_tables.sql
│   │   ├── V003__scanner_tables.sql
│   │   ├── V004__strategy_analog_tables.sql
│   │   ├── V005__evidence_and_audit.sql
│   │   └── V006__roles_and_grants.sql
│   ├── seeds/               # Reference data (deterministic, versioned)
│   │   ├── S001__ticker_universe.sql
│   │   └── S002__historical_analog_cases.sql
│   └── docker-entrypoint-initdb.d/  # Symlinked/ordered runner for first-boot init
│       └── 00_run_all.sh
├── mongo/
│   └── init/
│       └── 01_collections.js         # Collection + index creation, retention TTLs
├── redis/
│   └── redis.conf                    # Hardened local config (no persistence of secrets)
├── Dockerfile.postgres
├── Dockerfile.mongo
└── README.md
```

## PostgreSQL

Migrations run in filename order on first container boot (`docker-entrypoint-initdb.d`). They are
also safe to re-run against an existing DB (each uses `IF NOT EXISTS` / guarded `DO` blocks where
Postgres allows). The single baseline DDL in `specs/arch/data/postgres-ddl.sql` is decomposed here
into readable, reversible-in-spirit migrations (250–300 lines max each).

Ten entities: `ticker`, `ticker_universe`, `headline`, `news_verdict`, `scanner_run`,
`scanner_factor`, `scanner_ranking`, `strategy_recommendation`, `historical_analog_case`,
`analog_match`, plus polymorphic `evidence_citation` and `audit_log`.

## Seeds

- **`S001__ticker_universe.sql`** — 75–100 liquid US symbols (bounds-checked by the scanner loader).
- **`S002__historical_analog_cases.sql`** — 20–30 hand-curated analog cases with a deliberate
  favorable/unfavorable **outcome balance** (curation-bias check, FINRA-2210).

## MongoDB

Audit-only trace store. Collections: `llm_trace`, `prompt_version`, `agent_run`. Indexed by
`correlation_id` and `created_at`; a TTL index enforces the retention window.

## Redis

Namespaced, TTL-bound keys only: `session:*`, `news:*` (cache), `ratelimit:*`, `idem:*`.
See `../specs/arch/data/redis-keyspace.md` for the full keyspace contract.

## Local usage

```bash
# From repo root — brings up postgres, redis, mongo (plus api services)
docker compose up -d postgres redis mongo

# Verify Postgres schema
docker compose exec postgres psql -U quantmind -d quantmind -c '\dt'

# Verify Mongo collections
docker compose exec mongo mongosh quantmind_traces --eval 'db.getCollectionNames()'
```

Connection defaults (local dev, overridable via env): see root `.env.example`.
