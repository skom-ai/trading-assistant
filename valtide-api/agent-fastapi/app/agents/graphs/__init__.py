"""LangGraph agent flows (FR1/FR3) for the LangChain migration.

File: app/agents/graphs/__init__.py
Author: Sunil+Ai Assistant
Date: 2026-09-18
Description:
    Package holding the LangGraph StateGraph implementations of the FR1
    news-verdict and FR3 strategy flows. Each graph reuses the existing
    guardrails, validators, schemas, and structured parser unchanged, so
    the LangGraph path is behavior-equivalent to the native services.
"""
