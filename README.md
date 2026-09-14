# AI Stock Opportunity Discovery + Strategy

An AI research assistant for self-directed U.S. equity investors. It helps answer two questions —
"is this stock's news-driven move real?" and "what attractive candidates am I not already
watching?" — then, for a chosen stock, produces an evidence-grounded Buy/Wait/Avoid plan checked
against similar historical cases. The system supports the user's decision; it does not execute
trades.

## Status

**API + Database layers built and dockerized (2026-09-07).** The `valtide-api` (NestJS BFF +
FastAPI agent/deterministic engine) and `valtide-db` (PostgreSQL + Redis + MongoDB) tiers are
implemented against the specs, containerized, and verified end-to-end on a local Docker instance
(all six services healthy; FR1-FR4 exercised through the BFF; Swagger/OpenAPI served). The existing
`valtide-ui` React app matches the served response contracts. See
[`PROJECT_MEMORY.md`](PROJECT_MEMORY.md) for the full build record and follow-ups.

## Quick start

```bash
cp .env.example .env
docker-compose up -d --build      # UI :3000 · BFF :8080 (/api/docs) · agent :8000 (/docs)
```

Layer READMEs: [`valtide-api/README.md`](valtide-api/README.md),
[`valtide-db/README.md`](valtide-db/README.md),
[`valtide-api/agent-fastapi/README.md`](valtide-api/agent-fastapi/README.md),
[`valtide-api/bff-nestjs/README.md`](valtide-api/bff-nestjs/README.md).

## Documents

- [`AIEF C5 MVP HJ-MS.md`](AIEF%20C5%20MVP%20HJ-MS.md) / `.xlsx` — the original submitted capstone
  proposal (source of truth for the full long-term vision).
- [`AIEF C5 MVP HJ-MS(b).md`](AIEF%20C5%20MVP%20HJ-MS(b).md) — a rescoped version of the MVP sized
  for a 1-week, 2-person build (narrower scanner universe, curated historical analogs instead of a
  live backtest engine, no auth/login, no vector DB).
- [`docs/superpowers/specs/2026-08-19-stock-opportunity-functional-spec.md`](docs/superpowers/specs/2026-08-19-stock-opportunity-functional-spec.md) —
  draft functional specification: what the system does and how it behaves, independent of
  architecture. A design specification (architecture, tech stack, data flow) will follow as a
  separate document.
- `CLAUDE.md` — guidance for Claude Code when working in this repo.

## Architecture (as built)

Three tiers; the API tier is a logical **BFF → Process → System/Data** split over two services,
per the specs (`specs/arch/HLD.md`, `SDD.md`, `DDD.md`).

- **UI** (`valtide-ui`) — React/Vite. Talks only to the NestJS BFF (Principle P1).
- **BFF** (`valtide-api/bff-nestjs`) — NestJS; the sole public, AI-mediating API. Correlation-id
  origin, strict DTO validation, rate limiting, sanitized error taxonomy, Swagger at `/api/docs`.
- **Agent/Engine** (`valtide-api/agent-fastapi`) — FastAPI; internal only. LangGraph-style
  reasoning nodes (FR1/FR3) plus a strictly isolated zero-LLM deterministic engine (FR2/FR4), all
  FR5 guardrails, provider adapters, a **mock LLM by default** (swap to live via config).
- **Data** (`valtide-db`) — PostgreSQL (system of record, 10 entities, no PII), Redis
  (session/cache/rate-limit), MongoDB (audit-only LLM traces).

Every output cites its evidence and returns `Insufficient Evidence` rather than guess. Deterministic
paths never call the LLM (CI-asserted). LLM access is via a swappable adapter (mock → OpenRouter).

## Contributing

```bash
# Agent service (Python 3.12)
cd valtide-api/agent-fastapi && pip install -e ".[dev]" && pytest      # 25 tests, ~93% coverage
# BFF (Node)
cd valtide-api/bff-nestjs && npm install && npm test                   # controller mediation tests
```

