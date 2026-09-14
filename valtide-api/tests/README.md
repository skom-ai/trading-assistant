# Valtide API — Test Suites

This folder holds the **cross-service** API test suites. Per-service unit tests live inside each
service (`agent-fastapi/tests`, `bff-nestjs/src/**/*.spec.ts`).

## 1. Newman (API contract / integration)

Full Postman collection covering every BFF endpoint (FR1-FR4), the guardrail disclaimers, scanner
determinism, the sanitized error taxonomy, and correlation-id propagation.

```bash
# Stack must be running (docker compose up, or agent+bff locally on :8080)
npx newman run tests/postman/valtide-bff.postman_collection.json \
    -e tests/postman/local.postman_environment.json
```
Result: 8 requests, 20 assertions.

## 2. Penetration / security (pytest, black-box)

Negative tests asserting the platform RESISTS attacks — each maps to a STRIDE threat in
`specs/arch/security/threat-model-stride.md`.

```bash
# Stack must be running; target overridable via VT_PENTEST_TARGET
cd agent-fastapi
VT_PENTEST_TARGET=http://localhost:8080 \
    .venv/bin/python -m pytest ../tests/pentest -v -o addopts=""
```
Covers: prompt-injection, SQLi/traversal, XSS reflection, error-leak, oversized/wrong-type/unknown
input, HTTP-method abuse, and rate-limit burst. Result: 9 tests.

## 3. Per-service unit tests (for reference)

```bash
cd agent-fastapi && pytest                 # 42 tests, ~98% coverage
cd bff-nestjs   && npm test                # 17 tests, ~96% coverage
```

## 4. UI tests (in valtide-ui)

```bash
cd ../../valtide-ui
npm run test:cov     # Vitest unit — 10 tests, 100% on tested scope
npm run test:e2e     # Playwright e2e — 4 tests (boots the dev server)
```
