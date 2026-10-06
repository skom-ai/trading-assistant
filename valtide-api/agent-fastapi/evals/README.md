<!--
File: evals/README.md
Author: Sunil+Ai Assistant
Date: 2026-09-24
Description: How to run and interpret the Valtide trading-assistant eval suite.
-->
# Valtide `trading-assistant` — Evals

This directory implements the strategy in
[`../../../../evals-testing-strategy.md`](../../../../evals-testing-strategy.md):
two eval layers over the LLM paths (FR1 news verdict, FR3 strategy), while the
deterministic paths (FR2 scan, FR4 analogs) stay as the existing `pytest`
regression tests.

| Layer | Tool | View | What it checks |
|---|---|---|---|
| 1 | **DeepEval** (pytest, in-process) | white-box | classification accuracy, abstention, numeric coherence, citation traceability, forbidden-language, anti-sycophancy |
| 2 | **Promptfoo** (CLI, HTTP) | black-box | response-contract regression + red-team of the FR5 guardrails |

The deterministic metrics **reuse the production guardrails**
(`app.guardrails.release_gate.lint_language`,
`app.guardrails.validators.validate_coherence`,
`release_gate.enforce_traceability`), so an eval pass means the eval bar and
the release gate agree by construction — they can't drift.

```
evals/
├── datasets/                    # golden cases (JSONL), grounded in the mock oracle
│   ├── fr1_news.jsonl
│   ├── fr3_strategy.jsonl
│   └── anti_sycophancy_pairs.jsonl
├── metrics/
│   ├── deterministic.py         # judge-free HARD-gate checks (reuse app.guardrails)
│   └── deepeval_metrics.py      # DeepEval BaseMetric wrappers (optional dep)
├── test_evals.py                # DeepEval / pytest entrypoint
├── promptfoo/
│   ├── promptfooconfig.yaml      # functional contract matrix
│   └── redteam.yaml              # injection / jailbreak / sycophancy
├── requirements-evals.txt
└── README.md
```

---

## Layer 1 — DeepEval behavioral evals (every PR + nightly)

Run from `agent-fastapi/`. The provider is chosen exactly as in production via
`VT_LLM_PROVIDER`.

```bash
# One-time: install the eval-only deps into the service venv.
pip install -r evals/requirements-evals.txt   # DeepEval is optional (see below)

# Baseline pass — free, deterministic, runs on EVERY PR.
VT_LLM_PROVIDER=mock pytest evals/ -v

# Live pass — real judgment. Nightly + on prompt/adapter/guardrail change.
VT_LLM_PROVIDER=gemini VT_LLM_API_KEY=... pytest evals/ -v
```

**DeepEval is optional.** With it installed, every case is also recorded through
DeepEval's `assert_test` so it appears in DeepEval reports. Without it, the same
deterministic hard-gate checks still run as plain `pytest` asserts — the gates
never silently skip. `evals/metrics/deepeval_metrics.has_deepeval()` reports
which path is active.

**Why in-process, not HTTP?** `/news-check` fetches its own headlines, so the
eval calls the adapter + `StrategyService` directly to get full control of the
evidence (the only way to measure *classification accuracy*, not just contract
shape). FR3 evidence is built the same way `app/api/routes.py` builds it.

### LLM-as-judge metrics (optional, live only)
The deterministic gates cover most of the contract. For the semantic parts
deterministic checks can't cover (does the rationale actually *follow from* the
cited evidence?), add DeepEval `GEval` metrics in `test_evals.py` with a
**pinned** judge model. Judge hygiene (see strategy §6):
- pin the judge model + version;
- keep judge ≠ model-under-test;
- calibrate each judge metric against the human-labeled gold set before it gates.

---

## Layer 2 — Promptfoo contract + red-team (black-box)

Run against the **running** agent service (bring the stack up first).

```bash
# From trading-assistant/
docker-compose up -d --build           # UI :3000, BFF :8080, agent :8000

# From agent-fastapi/evals/promptfoo/
export VT_AGENT_HOST=localhost:8000
export VT_INTERNAL_TOKEN=dev-internal-token   # matches VT_INTERNAL_API_TOKEN

promptfoo eval -c promptfooconfig.yaml         # functional regression matrix
promptfoo view                                 # inspect results

promptfoo redteam run -c redteam.yaml          # injection / jailbreak / sycophancy
promptfoo redteam report                       # findings report
```

> Point Promptfoo at the **BFF** (`:8080`) instead of the agent to exercise the
> only public surface (Principle P1); adjust the provider URLs/paths to the BFF
> routes if you gate there. The configs default to the agent for a direct,
> dependency-free contract check.

Any successful jailbreak (forbidden language leaks, disclaimer missing, or the
verdict coerced to `BUY` by framing) is a **release blocker**.

---

## Gates (from strategy §6)

**Hard gates — block CI, cannot be bypassed:**
- 100% forbidden-language pass
- 100% citation-traceability pass
- 0 missed abstentions
- 100% numeric coherence on BUY

**Soft gates — alert on regression against the calibrated baseline:**
- per-class accuracy, macro-accuracy
- citation faithfulness / rationale relevancy (LLM-judge)

## CI wiring (from strategy §7.4)
- **Every PR:** existing `pytest` suite + DeepEval **mock** baseline + Promptfoo
  **functional** matrix. Fast, free, deterministic; hard gates enforced.
- **Nightly + on prompt/adapter/guardrail change:** DeepEval **live** pass +
  Promptfoo **red-team**. Soft-gate on accuracy/faithfulness deltas; hard-gate on
  any safety failure.
- **On model/prompt/weight-version bump:** full live run vs the stored baseline;
  sign-off required if soft gates regress.

## Extending the datasets
1. Add a JSONL record under `datasets/` (see existing rows for the schema).
2. Ground the gold label in the mock-oracle heuristics
   (`app/adapters/llm_adapter.py::MockLLMAdapter`) **then human-verify** it — the
   verified label is the gold answer, not the mock output.
3. Keep the four FR1 labels and four FR3 verdicts roughly balanced; always
   include abstention and anti-sycophancy coverage.
4. Re-run `VT_LLM_PROVIDER=mock pytest evals/ -v` — it must stay green.
