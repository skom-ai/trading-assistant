"""Valtide eval metrics package.

File: evals/metrics/__init__.py
Author: Sunil+Ai Assistant
Date: 2026-09-24
Description:
    DeepEval-compatible custom metrics for the trading-assistant behavioral
    eval suite. Deterministic metrics reuse the SAME guardrail functions the
    service enforces (app.guardrails.*), so an eval pass means the eval and
    the production gate agree by construction rather than by a re-implemented
    copy that could drift.
"""
