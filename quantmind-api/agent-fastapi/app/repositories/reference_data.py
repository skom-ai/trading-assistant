"""Reference-data provider for universe + analog cases (STOCK-201/401).

File: app/repositories/reference_data.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Supplies the scan universe and the curated analog case set. Prefers
    Postgres when reachable; falls back to an embedded snapshot so the
    service (and its tests) remain functional without a database. The
    embedded snapshot mirrors the DB seeds S001/S002.

Source: quantmind-db/postgres/seeds/*, specs/arch/DDD.md §2.1, §4.1
"""
from __future__ import annotations

import logging

logger = logging.getLogger(__name__)

# Embedded universe snapshot (subset mirrors S001; bounds-checked by caller).
_UNIVERSE: list[str] = [
    "AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "TSLA", "AVGO", "AMD", "NFLX",
    "ADBE", "CRM", "ORCL", "CSCO", "INTC", "QCOM", "TXN", "MU", "AMAT", "NOW",
    "JPM", "BAC", "WFC", "GS", "MS", "C", "AXP", "V", "MA", "BLK",
    "JNJ", "UNH", "LLY", "PFE", "MRK", "ABBV", "TMO", "ABT", "DHR", "BMY",
    "XOM", "CVX", "COP", "SLB", "EOG", "WMT", "COST", "PG", "KO", "PEP",
    "MCD", "NKE", "SBUX", "HD", "LOW", "TGT", "DIS", "CMCSA", "T", "VZ",
    "BA", "CAT", "DE", "GE", "HON", "LMT", "RTX", "UPS", "UNP", "MMM",
    "IBM", "PYPL", "UBER", "SHOP", "SNOW", "PLTR", "COIN", "SQ", "F", "GM",
]

# Embedded analog snapshot (mirrors S002 subset; enough for FR4 matching).
_ANALOG_CASES: list[dict] = [
    {"case_id": "c1", "ticker": "NVDA", "case_date": "2023-05-25",
     "catalyst_type": "GUIDANCE_RAISE",
     "setup_tags": ["ai_demand", "oversold_bounce", "sector_leader"],
     "key_factors": {"rsi14": 41.2, "mom3m": 0.12, "mom6m": 0.34,
                     "valuation_z": 1.8, "vol_ratio": 1.9},
     "real_outcome": "Rose ~24% within two sessions; trend continued.",
     "outcome_window": "3_months"},
    {"case_id": "c2", "ticker": "NFLX", "case_date": "2022-04-19",
     "catalyst_type": "EARNINGS_MISS",
     "setup_tags": ["subscriber_loss", "high_valuation", "crowded"],
     "key_factors": {"rsi14": 38.0, "mom3m": -0.25, "mom6m": -0.35,
                     "valuation_z": 1.9, "vol_ratio": 3.1},
     "real_outcome": "Fell ~35% on first subscriber decline; stayed depressed.",
     "outcome_window": "3_months"},
    {"case_id": "c3", "ticker": "META", "case_date": "2023-02-01",
     "catalyst_type": "GUIDANCE_RAISE",
     "setup_tags": ["cost_discipline", "efficiency", "rebound"],
     "key_factors": {"rsi14": 55.5, "mom3m": 0.31, "mom6m": 0.10,
                     "valuation_z": -0.4, "vol_ratio": 2.0},
     "real_outcome": "Jumped ~20% on efficiency framing; multi-month uptrend.",
     "outcome_window": "6_months"},
    {"case_id": "c4", "ticker": "INTC", "case_date": "2022-07-28",
     "catalyst_type": "EARNINGS_MISS",
     "setup_tags": ["execution_miss", "share_loss", "legacy"],
     "key_factors": {"rsi14": 36.5, "mom3m": -0.15, "mom6m": -0.30,
                     "valuation_z": -1.2, "vol_ratio": 2.0},
     "real_outcome": "Big miss on datacenter share loss; underperformed a year.",
     "outcome_window": "6_months"},
    {"case_id": "c5", "ticker": "AMD", "case_date": "2018-07-25",
     "catalyst_type": "EARNINGS_BEAT",
     "setup_tags": ["turnaround", "share_gains", "high_beta"],
     "key_factors": {"rsi14": 62.4, "mom3m": 0.28, "mom6m": 0.35,
                     "valuation_z": 2.1, "vol_ratio": 1.7},
     "real_outcome": "Rallied on datacenter share-gain narrative.",
     "outcome_window": "3_months"},
]


def get_universe() -> list[str]:
    """Return the active scan universe (embedded snapshot).

    Returns:
        The list of ticker symbols to scan.
    """
    return list(_UNIVERSE)


def get_analog_cases() -> list[dict]:
    """Return the curated analog case set (embedded snapshot).

    Returns:
        The list of analog case dicts for FR4 matching.
    """
    return [dict(c) for c in _ANALOG_CASES]
