# Valtide — Project Memory

**Purpose of this file:** durable, single-page context for any future session (human or agent)
picking up this project. It records what was built, why, where things live, how to run/test them,
and what remains. Update it when the architecture or status changes.

**Last updated:** 2026-09-07 · **Status:** API + DB built, dockerized, bound to LIVE Gemini,
verified end-to-end. Full test matrix (unit/API/e2e/PEN) green.

---

## 1. What this is

Valtide is an **educational stock-opportunity decision-support tool** (NOT a broker, NOT
personalized advice). It: (FR1) classifies a ticker's news move as Real Catalyst / Already Priced
In / Hype; (FR2) deterministically scans a universe and ranks the top 10; (FR3) turns a candidate
into a Buy/Wait/Avoid strategy; (FR4) validates it against curated historical analogs; (FR5)
enforces traceability, insufficient-evidence honesty, anti-sycophancy, and forbidden-language
guardrails across everything.

## 2. Architecture (as built)

Three tiers; the API tier is a logical **BFF → Process → System/Data** split over two services.

```
Next.js/Vite UI ──► NestJS BFF (P1 mediator, only public API) ──► FastAPI agent+engine ──► Postgres + Redis + Mongo
   valtide-ui        valtide-api/bff-nestjs                     valtide-api/agent-fastapi   valtide-db
```

**Enforced invariants:** P1 UI never calls FastAPI directly; P2 deterministic engine (FR2/FR4)
never calls the LLM (CI-asserted); P3 every claim traces to an `evidence_citation`; P5 absence of
evidence → INSUFFICIENT_EVIDENCE, never a guess.

## 3. Key decisions (confirmed with user)

- **Live Google Gemini** by default (`VT_LLM_PROVIDER=gemini`, `VT_LLM_MODEL=gemini-3.6-flash`) via
  the `google-genai` SDK, keyed by `GEMINI_API_KEY` (or `VT_LLM_API_KEY`). **IMPORTANT model note:**
  `gemini-2.0-flash` is RETIRED (Google's API returns 404 recommending `gemini-3.6-flash`); the
  low-cost testing model in use is **`gemini-3.6-flash`**. The adapter retries transient 5xx/429
  ("high demand") with backoff. A deterministic **mock** adapter remains for offline tests and as an
  automatic fallback when no key is set (`VT_LLM_PROVIDER=mock`).
- **Logical layers**, not separate deployables.
- **Full build in one pass.**
- Files kept 250–300 lines, standard headers, structured logging, docstrings/comments.

## 3b. Test matrix (all green, 2026-09-07)

| Suite | Where | Count | Coverage |
|---|---|---|---|
| Agent unit (pytest) | `agent-fastapi/tests` | 42 | ~97% |
| BFF unit (jest) | `bff-nestjs/src/**.spec.ts` | 17 | ~96% stmts / 100% br |
| UI unit (vitest) | `valtide-ui/src/**.test.tsx` | 10 | 100% (tested scope) |
| UI e2e (playwright) | `valtide-ui/e2e` | 4 | n/a |
| API integration (newman) | `valtide-api/tests/postman` | 20 assertions | n/a |
| Security / PEN (pytest) | `valtide-api/tests/pentest` | 9 | n/a |

Run: see `valtide-api/tests/README.md`. Coverage exceeds the 95% target on the units that carry
logic (bootstrap/wiring files are excluded from the denominator and covered by newman/e2e).

## 4. Directory map

```
trading-assistant/
├── docker-compose.yml        # all 6 services; .env.example alongside
├── valtide-db/             # Postgres migrations V001-V006 + seeds S001/S002, Mongo init, Redis conf, Dockerfiles
├── valtide-api/
│   ├── agent-fastapi/        # Process + System/Data: engine/ guardrails/ services/ adapters/ api/ ; pyproject; Dockerfile; tests/
│   └── bff-nestjs/           # BFF: common/ agent/ features/ ; package.json; Dockerfile; *.spec.ts
├── valtide-ui/             # existing Vite React UI (+ new Dockerfile); still mock-data driven
└── specs/                    # requirements/, arch/ (HLD/SDD/DDD, diagrams, DDL, mongo/redis), design/
```

## 5. Data model (Postgres — from specs/arch/data/postgres-ddl.sql)

10 tables: `ticker`, `ticker_universe`, `headline`, `news_verdict`, `scanner_run`,
`scanner_factor`, `scanner_ranking`, `strategy_recommendation`, `historical_analog_case`,
`analog_match`, plus polymorphic `evidence_citation` + append-only `audit_log`. No PII by design.
Roles: `app_readwrite` (no DELETE on audit/citation), `app_audit_readonly`.

## 6. Algorithms (deterministic engine)

- **Factors (FR2):** RSI-14 (Wilder), 3M/6M return, 20D/3M volume ratio, universe-relative P/E
  z-score. Edge rules: negative earnings excluded from z-score; short history → momentum None;
  guarded volume denominator.
- **Composite (FR2):** min-max normalize per factor (valuation inverted, RSI centered on 50),
  versioned weights `WEIGHT_SETS[v1]`, top-10, tie-break by symbol asc. Byte-identical across runs.
- **Analog (FR4):** `sim = 0.5*Jaccard(tags∪catalyst) + 0.5*(1 - normalized_euclidean(factors))`,
  min threshold 0.35, top-3, tie-break by case_id. Mechanical match-reason string.

## 7. Guardrail release order (FR3)

`FramingNeutralizer → SufficiencyEvaluator → StrategyNode(LLM) → StructuredParser(≤3 retries) →
CoherenceValidator(≤1 regen) → AnalogMatcher(parallel, isolated) → TraceabilityGate →
ForbiddenLanguageLinter → response`. Error taxonomy codes propagate unchanged FastAPI→BFF→UI.

## 8. Run / test / build

```bash
# Full stack (from trading-assistant/): cp .env.example .env first
docker-compose up -d --build          # UI :3000, BFF :8080, agent :8000 (localhost), pg/redis/mongo internal
#   NOTE: `docker compose` plugin is sandbox-blocked here; use the `docker-compose` binary. Legacy
#   builder if buildx is blocked: DOCKER_BUILDKIT=0 docker build -f <Dockerfile> -t <tag> <ctx>

# Agent tests (Python 3.12):  cd valtide-api/agent-fastapi && pip install -e ".[dev]" && pytest   (25 tests, ~93%)
# BFF tests (Node):           cd valtide-api/bff-nestjs && npm install && npm test              (3 tests)

# Docs:  BFF Swagger http://localhost:8080/api/docs   ·   Agent OpenAPI http://localhost:8000/docs
```

## 9. Verified (2026-09-07)

Full Docker stack came up healthy; Postgres seeded (80 universe, 24 analogs); FR1/FR2/FR3/FR4 all
returned correct payloads end-to-end through the containerized BFF→FastAPI chain; Swagger + OpenAPI
served; validation rejects bad tickers with the sanitized taxonomy envelope; scanner determinism +
zero-LLM assertions pass.

## 10. Open follow-ups (documented for next time)

- **UI → BFF wiring:** a typed client exists (`valtide-ui/src/api/client.ts`) and is unit-tested,
  but the screen components still render `src/data/mockData.ts` — swap each screen's data source to
  `valtideApi.*` calls to go fully live in the browser.
- **Live persistence path:** DB is provisioned + seeded, but the request path computes against
  deterministic synthetic market/news providers + embedded reference data; wire the FastAPI
  repositories to read/write Postgres/Redis/Mongo per request.
- **Real yfinance/news adapters** behind the existing config switch (LLM is already live via Gemini).
- **Idempotency + Redis session state** for FR3 (schema + keyspace defined; wiring pending).
- **Gemini demand spikes:** `gemini-3.6-flash` can return transient 503 under load; the adapter
  retries 3x with backoff, then surfaces `SOURCE_UNAVAILABLE` — expected, not a bug.
```
