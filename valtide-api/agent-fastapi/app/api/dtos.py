"""Internal API request/response DTOs.

File: app/api/dtos.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Request and response models for the FastAPI internal surface the BFF
    calls. Strict validation (extra='forbid') and the ticker allowlist
    regex are applied here as defense-in-depth behind the NestJS boundary.

Source: specs/arch/SDD.md §2.1, specs/arch/DDD.md §1.1
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

_TICKER_RE = r"^[A-Z.\-]{1,10}$"


class NewsCheckRequest(BaseModel):
    """FR1 request body."""

    model_config = ConfigDict(extra="forbid")

    symbol: str = Field(pattern=_TICKER_RE)
    simulate_empty: bool = False


class ScanRequest(BaseModel):
    """FR2 request body (universe optional; server default when omitted)."""

    model_config = ConfigDict(extra="forbid")

    universe: list[str] | None = None


class StrategyRequest(BaseModel):
    """FR3/FR4 request body."""

    model_config = ConfigDict(extra="forbid")

    symbol: str = Field(pattern=_TICKER_RE)
    user_framing: str | None = Field(default=None, max_length=500)
    news_label: str | None = None


class ErrorResponse(BaseModel):
    """Standard sanitized error envelope (no stack, no internal ids)."""

    model_config = ConfigDict(extra="forbid")

    code: str
    message: str
    correlation_id: str
    details: dict = Field(default_factory=dict)
