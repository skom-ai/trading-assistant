"""Structured-output parsing with bounded retries (S4 / STOCK-607).

File: app/agents/structured_parser.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    The single Pydantic-validation-with-retry implementation reused by the
    news and strategy nodes. Validates the LLM's JSON against a strict
    model (extra='forbid'); on failure it re-invokes the adapter up to
    MAX_RETRIES with the validation error appended, then raises a TYPED
    failure. Never falls back to raw/unvalidated text.

Source: specs/arch/SDD.md §4
"""
from __future__ import annotations

import logging
from typing import TypeVar

from pydantic import BaseModel, ValidationError

from app.adapters.llm_adapter import LLMAdapter
from app.core.errors import DomainError, ErrorCode

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
T = TypeVar("T", bound=BaseModel)


def parse_with_retries(
    adapter: LLMAdapter,
    feature: str,
    prompt: str,
    evidence: dict,
    model_cls: type[T],
) -> T:
    """Invoke the LLM and validate its output, retrying on parse failure.

    Args:
        adapter: The LLM adapter to invoke.
        feature: Feature key ("FR1_NEWS" / "FR3_STRATEGY").
        prompt: The assembled base prompt.
        evidence: The structured evidence block.
        model_cls: The Pydantic model to validate against.

    Returns:
        A validated instance of model_cls.

    Raises:
        DomainError: AGENT_OUTPUT_INVALID after MAX_RETRIES failures.
    """
    last_error: str = ""
    for attempt in range(1, MAX_RETRIES + 1):
        effective_prompt = prompt if attempt == 1 else (
            f"{prompt}\n\nPrevious output was invalid: {last_error}. "
            f"Return ONLY valid JSON for the schema."
        )
        raw = adapter.complete_json(feature, effective_prompt, evidence)
        try:
            parsed = model_cls.model_validate(raw)
            if attempt > 1:
                logger.info("structured parse recovered on attempt %d", attempt)
            return parsed
        except ValidationError as exc:  # noqa: PERF203 - bounded loop
            last_error = str(exc)
            logger.warning("structured parse failed attempt %d/%d", attempt, MAX_RETRIES)

    raise DomainError(
        ErrorCode.AGENT_OUTPUT_INVALID,
        "The analysis engine could not produce a valid, structured result.",
        {"attempts": MAX_RETRIES},
    )
