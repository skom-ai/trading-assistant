"""Domain enums and provider data models.

File: app/domain/enums.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Enumerations mirrored from the Postgres DDL and the DTO contract, plus
    the internal value objects for provider-sourced market and news data.
    Kept as the single source so repositories, engine, and agents agree.

Source: specs/arch/data/postgres-ddl.sql, specs/arch/DDD.md
"""
from __future__ import annotations

from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, Field


class NewsVerdictLabel(str, Enum):
    """FR1 verdict labels."""

    REAL_CATALYST = "REAL_CATALYST"
    ALREADY_PRICED_IN = "ALREADY_PRICED_IN"
    HYPE = "HYPE"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class StrategyVerdict(str, Enum):
    """FR3 strategy verdicts."""

    BUY = "BUY"
    WAIT = "WAIT"
    AVOID = "AVOID"
    INSUFFICIENT_EVIDENCE = "INSUFFICIENT_EVIDENCE"


class ConfidenceLevel(str, Enum):
    """FR3 confidence enum (evidence strength, never profit probability)."""

    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class FactorName(str, Enum):
    """FR2 scanner factor identifiers."""

    VALUATION_ZSCORE = "VALUATION_ZSCORE"
    MOMENTUM_3M = "MOMENTUM_3M"
    MOMENTUM_6M = "MOMENTUM_6M"
    RSI_14 = "RSI_14"
    VOLUME_TREND = "VOLUME_TREND"


class MarketData(BaseModel):
    """Normalized, provenance-stamped market data for one ticker.

    Attributes:
        symbol: Ticker symbol.
        prices: Daily close prices, oldest-first.
        volumes: Daily volumes aligned with prices.
        pe_ratio: Trailing P/E (None when earnings are negative/undefined).
        last_price: Most recent close.
        provenance: Source + retrieval descriptor for audit.
    """

    model_config = ConfigDict(extra="forbid")

    symbol: str
    prices: list[float] = Field(default_factory=list)
    volumes: list[float] = Field(default_factory=list)
    pe_ratio: float | None = None
    last_price: float | None = None
    provenance: str


class Headline(BaseModel):
    """A single normalized news headline.

    Attributes:
        source: Publisher name.
        title: Headline text (escaped before render, not here).
        url: Canonical article URL.
        published_at: UTC publish timestamp.
        content_hash: SHA-256 of (title+url+published_at).
    """

    model_config = ConfigDict(extra="forbid")

    source: str
    title: str
    url: str
    published_at: datetime
    content_hash: str
