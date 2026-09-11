# QuantMind API — Layered API Tier

**Component:** `quantmind-api` | **Part of:** AI Stock Opportunity Discovery & Strategy Platform
**Source of truth:** `../specs/arch/SDD.md`, `../specs/arch/DDD.md`, `../specs/requirements/*.md`

This tier implements the platform's API in an **API-led (3-layer) decomposition** mapped onto the
2-service stack fixed by the specs. The layers are **logical** (organized by module, enforced by
code review + import rules), not separate deployables — this matches the SDD's two-service design
while honoring the BFF → Process → System API contract.

```
                 ┌──────────────────────────────────────────────┐
   Next.js UI ─► │  BFF layer          (NestJS)                   │  per-screen aggregation,
                 │                                                │  auth boundary, validation,
                 │                                                │  correlation-id, rate-limit
                 ├──────────────────────────────────────────────┤
                 │  Process layer      (NestJS orch + FastAPI)    │  FR1/FR3 LangGraph flows,
                 │                                                │  FR2/FR4 deterministic engine,
                 │                                                │  guardrail release gate
                 ├──────────────────────────────────────────────┤
                 │  System/Data layer  (FastAPI)                  │  Postgres repos, Redis, Mongo,
                 │                                                │  yfinance/news/LLM adapters
                 └──────────────────────────────────────────────┘
```

## Two services

| Service | Dir | Tech | Owns |
|---|---|---|---|
| **BFF** | `bff-nestjs/` | NestJS + TypeScript | Sole AI-call mediator (P1); the only publicly routable API. Correlation-id origin, DTO validation, rate-limit, session, error-taxonomy, per-screen aggregation. |
| **Agents / Engine** | `agent-fastapi/` | FastAPI + Python | Process + System/Data layers: LangGraph reasoning nodes (FR1/FR3), the zero-LLM deterministic engine (FR2/FR4), all guardrail modules, provider adapters, repositories. Never publicly routable. |

## Architecture invariants (enforced, not conventional)

- **P1** — UI never calls FastAPI directly; every AI call is mediated by NestJS.
- **P2** — Deterministic engine (scanner, analog matcher) never calls the LLM. CI zero-LLM-call assertion.
- **P3** — Every user-facing factual claim traces to a persisted `evidence_citation` (TraceabilityGate).
- **P5** — Absence of evidence → `INSUFFICIENT_EVIDENCE`, never a guess.
- Files are 250–300 lines max, each with a standard header, structured logging, and comments.

## OpenAPI / Swagger

- The FastAPI service auto-generates OpenAPI 3.x at `/openapi.json`, Swagger UI at `/docs`.
- The NestJS BFF exposes Swagger UI at `/api/docs` (the client-facing contract).
- The BFF contract is the source of truth for the UI's typed client.

## Mock-LLM adapter

FR1/FR3 use a **deterministic mock LLM adapter** by default (`LLM_PROVIDER=mock`) so the whole app is
functional and testable offline. Set `LLM_PROVIDER=openrouter` + `LLM_API_KEY=...` to switch to a
live provider — no code change, the adapter is swapped by config.

## Local run

```bash
# From repo root
docker compose up -d --build
# BFF (client-facing):     http://localhost:8080/api/docs
# FastAPI (internal only): http://localhost:8000/docs
```

See `agent-fastapi/README.md` and `bff-nestjs/README.md` for per-service detail.
