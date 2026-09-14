"""Structured domain schemas for agent + engine outputs.

File: app/domain/schemas.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Pydantic models with extra='forbid' (STOCK-607) used both as the LLM
    structured-output contract and as the internal result objects for the
    deterministic engine. These shapes back the API responses that feed
    the existing UI contracts.

Source: specs/arch/DDD.md §1.4, §3.4, §4.2; specs/arch/SDD.md §4
"""
from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field

from app.domain.enums import (
    ConfidenceLevel,
    FactorName,
    NewsVerdictLabel,
    StrategyVerdict,
)


class NewsVerdict(BaseModel):
    """FR1 LLM structured output.

    Attributes:
        label: The classification label.
        rationale: Evidence-grounded explanation.
        cited_headline_ids: Non-empty for non-abstention labels.
        confidence_hint: Optional qualitative hint.
    """

    model_config = ConfigDict(extra="forbid")

    label: NewsVerdictLabel
    rationale: str
    cited_headline_ids: list[str] = Field(default_factory=list)
    confidence_hint: str | None = None


class StrategyRecommendation(BaseModel):
    """FR3 LLM structured output.

    Attributes:
        verdict: BUY/WAIT/AVOID/INSUFFICIENT_EVIDENCE.
        entry: Entry level (None unless actionable BUY).
        target: Target level (None unless actionable BUY).
        stop: Stop level (None unless actionable BUY).
        holding_horizon: Free-text horizon descriptor.
        confidence: Evidence-strength confidence.
        rationale: Evidence-grounded explanation.
        cited_evidence_ids: Evidence backing each material claim.
        applicability_flags: Marks fields not_applicable for WAIT/AVOID.
    """

    model_config = ConfigDict(extra="forbid")

    verdict: StrategyVerdict
    entry: float | None = None
    target: float | None = None
    stop: float | None = None
    holding_horizon: str | None = None
    confidence: ConfidenceLevel
    rationale: str
    cited_evidence_ids: list[str] = Field(default_factory=list)
    applicability_flags: dict[str, str] = Field(default_factory=dict)


class ScannerFactorValue(BaseModel):
    """One raw factor value for one ticker (auditable evidence).

    Attributes:
        factor_name: Which factor.
        value: Numeric value (None when excluded, e.g. no earnings).
        data_provenance: Source/retrieval descriptor.
    """

    model_config = ConfigDict(extra="forbid")

    factor_name: FactorName
    value: float | None
    data_provenance: str


class ScannerRow(BaseModel):
    """A single ranked scanner result row.

    Attributes:
        symbol: Ticker symbol.
        rank: 1..10 rank in the run.
        composite_score: Deterministic composite.
        factors: All raw factor values (never hidden).
    """

    model_config = ConfigDict(extra="forbid")

    symbol: str
    rank: int
    composite_score: float
    factors: list[ScannerFactorValue]


class AnalogMatch(BaseModel):
    """A single FR4 analog match with a mechanical reason.

    Attributes:
        case_ticker: Historical case ticker.
        case_date: ISO date of the case.
        catalyst_type: The case catalyst.
        similarity_score: In [0,1].
        match_reason: Mechanically derived matched-dimension string.
        real_outcome: The recorded real outcome.
        rank: 1..3.
    """

    model_config = ConfigDict(extra="forbid")

    case_ticker: str
    case_date: str
    catalyst_type: str
    similarity_score: float
    match_reason: str
    real_outcome: str
    rank: int
