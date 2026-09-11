# QuantMind BFF (NestJS)

**Component:** `bff-nestjs` | **Layer:** BFF | **Stack:** NestJS 10 + TypeScript

The **sole publicly routable** service and the **only AI-call mediator** (Principle P1). Every UI
request enters here; all AI/agent work is dispatched to the internal FastAPI service through the
single `AgentClient`. The UI never calls FastAPI directly.

## Client-facing endpoints (`/api/v1`)

| Method | Path | Feature |
|---|---|---|
| POST | `/api/v1/news-check` | FR1 news verdict |
| POST | `/api/v1/scan` | FR2 top-10 scan |
| POST | `/api/v1/strategy` | FR3 strategy + FR4 analogs |
| GET | `/api/health` | liveness |

Swagger UI: `GET /api/docs`.

## Cross-cutting (SDD §2.1)

- **CorrelationMiddleware** — origin of `X-Correlation-Id`, propagated to the agent service.
- **ValidationPipe** (global) — allowlist + `forbidNonWhitelisted` + transform; ticker regex `^[A-Z.\-]{1,10}$`.
- **ThrottlerGuard** — per-window rate limiting (RateLimit module equivalent for MVP).
- **TaxonomyExceptionFilter** — sanitized `{code,message,correlationId}` envelope; agent error codes pass through unchanged.
- **CORS** — strict, configured origins only.

## Module map

```
src/
├── common/    config, correlation.middleware, error.filter
├── agent/     agent.client (the single P1 mediation client), agent.module
├── features/  news / scanner / strategy controllers + dtos + features.module
├── app.module.ts   throttler + correlation wiring
└── main.ts          bootstrap (pipe, cors, filter, swagger)
```

## Local dev

```bash
npm install
AGENT_BASE_URL=http://localhost:8000 npm run start:dev   # http://localhost:8080/api/docs
npm test
```

## Environment

`BFF_PORT`, `AGENT_BASE_URL`, `INTERNAL_API_TOKEN`, `CORS_ORIGINS`, `RATE_LIMIT`,
`RATE_WINDOW_SEC`, `AGENT_TIMEOUT_MS`.
