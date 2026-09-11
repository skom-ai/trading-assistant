"""Central error taxonomy (NFR5 / STOCK-608).

File: app/core/errors.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    The single, closed set of typed failure codes that propagate
    UNCHANGED from FastAPI -> NestJS -> Next.js. Each maps to a distinct
    UI state; no code is re-mapped at a hop. Domain code raises
    DomainError(code, ...) and the API layer serializes it consistently.

Source: specs/arch/SDD.md §5, specs/arch/DDD.md §6
"""
from __future__ import annotations

from enum import Enum


class ErrorCode(str, Enum):
    """Closed enumeration of platform error codes.

    Members:
        NO_DATA_FOUND: Zero data for a resolvable ticker.
        SOURCE_UNAVAILABLE: Upstream provider errored or timed out.
        UNSUPPORTED_TICKER: Ticker failed resolution.
        INSUFFICIENT_EVIDENCE: Evidence too thin/absent for a verdict.
        ANALYSIS_UNAVAILABLE: LLM failed after retries / provider down.
        AGENT_OUTPUT_INVALID: Structured parse failed after retries.
        UNSOURCED_CLAIM: TraceabilityGate blocked an unsourced claim.
        VALIDATION_ERROR: Malformed request payload.
    """

    NO_DATA_FOUND = "NO_DATA_FOUND"
    SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"
    UNSUPPORTED_TICKER = "UNSUPPORTED_TICKER"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"
    ANALYSIS_UNAVAILABLE = "ANALYSIS_UNAVAILABLE"
    AGENT_OUTPUT_INVALID = "AGENT_OUTPUT_INVALID"
    UNSOURCED_CLAIM = "UNSOURCED_CLAIM"
    VALIDATION_ERROR = "VALIDATION_ERROR"


# HTTP status mapping — INSUFFICIENT_EVIDENCE is a valid 200 outcome for
# some flows, so it is deliberately absent here (handled as a body state).
HTTP_STATUS_FOR: dict[ErrorCode, int] = {
    ErrorCode.NO_DATA_FOUND: 404,
    ErrorCode.SOURCE_UNAVAILABLE: 503,
    ErrorCode.UNSUPPORTED_TICKER: 422,
    ErrorCode.ANALYSIS_UNAVAILABLE: 503,
    ErrorCode.AGENT_OUTPUT_INVALID: 502,
    ErrorCode.UNSOURCED_CLAIM: 502,
    ErrorCode.VALIDATION_ERROR: 400,
}


class DomainError(Exception):
    """Typed domain failure carrying a taxonomy code.

    Attributes:
        code: The ErrorCode describing the failure.
        message: Human-readable, PII-free description.
        details: Optional structured, PII-free context.
    """

    def __init__(self, code: ErrorCode, message: str, details: dict | None = None) -> None:
        """Initialize the domain error.

        Args:
            code: The taxonomy code for this failure.
            message: A safe, user-presentable message.
            details: Optional structured context (no PII, no stack).
        """
        super().__init__(message)
        self.code = code
        self.message = message
        self.details = details or {}

    def http_status(self) -> int:
        """Return the HTTP status to serialize this error with.

        Returns:
            The mapped HTTP status, defaulting to 500 if unmapped.
        """
        return HTTP_STATUS_FOR.get(self.code, 500)
