# QuantMind Agent Service (FastAPI)

**Component:** `agent-fastapi` | **Layers:** Process + System/Data
**Stack:** FastAPI + Pydantic v2 + NumPy/Pandas | **Python:** 3.12

The internal AI-agent and deterministic-engine service. **Never publicly routable** — it is called
only by the NestJS BFF (Principle P1). Implements FR1–FR5.

## Endpoints (internal, `/internal/v1`)

| Method | Path | Feature | LLM? |
|---|---|---|---|
| POST | `/news-check` | FR1 news verdict | yes (mock by default) |
| POST | `/scan` | FR2 deterministic top-10 | **no** (zero-LLM, CI-asserted) |
| POST | `/strategy` | FR3 strategy + FR4 analogs | yes (mock by default) |
| GET | `/health` | liveness | no |

OpenAPI: `GET /openapi.json` · Swagger UI: `GET /docs`.

## Module map

```
app/
├── core/        config, JSON logging (+correlation id), error taxonomy
├── domain/      enums + Pydantic schemas (extra='forbid')
├── engine/      DETERMINISTIC (no-LLM): factor_engine, composite_scorer, analog_matcher
├── adapters/    llm_adapter (mock/live), market_news (yfinance/news)
├── guardrails/  validators (sufficiency, framing, coherence), release_gate (linter, traceability, disclaimers)
├── agents/      structured_parser (bounded-retry Pydantic validation)
├── services/    Process-layer orchestration: news / scanner / strategy
├── repositories/ reference_data (universe + analog cases; DB with embedded fallback)
└── api/         dtos, routes, and the app factory (main.py)
```

## Guardrail release order (FR3)

`FramingNeutralizer → SufficiencyEvaluator → StrategyNode(LLM) → StructuredParser(≤3) →
CoherenceValidator(≤1 regen) → AnalogMatcher(parallel, isolated) → TraceabilityGate →
ForbiddenLanguageLinter → response`

## Mock vs live LLM

Default `QM_LLM_PROVIDER=mock` — deterministic, evidence-driven, offline-testable. Set
`QM_LLM_PROVIDER=openrouter` + `QM_LLM_API_KEY=...` to swap in a live provider (no code change).

## Local dev

```bash
python3.12 -m venv .venv && . .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000   # http://localhost:8000/docs
pytest                                       # 25 tests, ~93% coverage
```

## Environment (prefix `QM_`)

`QM_POSTGRES_DSN`, `QM_REDIS_URL`, `QM_MONGO_URL`, `QM_LLM_PROVIDER`, `QM_LLM_API_KEY`,
`QM_LLM_MODEL`, `QM_INTERNAL_API_TOKEN`, `QM_SCANNER_WEIGHT_VERSION`, `QM_ANALOG_SIMILARITY_VERSION`.
