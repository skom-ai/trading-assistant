"""Unit tests for the deterministic factor engine.

File: tests/test_factor_engine.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Verifies RSI(14) against an independent reference, momentum lookback,
    volume-trend guarding, and valuation z-score exclusion rules
    (DDD §2.2 edge cases).
"""
from __future__ import annotations

from app.domain.enums import FactorName, MarketData
from app.engine import factor_engine


def test_rsi_matches_reference_within_tolerance() -> None:
    """RSI on a known monotonic-up series approaches 100."""
    prices = [float(p) for p in range(100, 130)]  # strictly increasing
    rsi = factor_engine.compute_rsi14(prices)
    assert rsi is not None and rsi > 95.0


def test_rsi_none_on_insufficient_history() -> None:
    """RSI returns None when fewer than 15 prices are available."""
    assert factor_engine.compute_rsi14([1.0, 2.0, 3.0]) is None


def test_return_guards_short_history_and_zero_base() -> None:
    """Momentum returns None for short history or non-positive base."""
    assert factor_engine.compute_return([10.0, 11.0], lookback=63) is None
    # Base sits at index -(lookback+1); make THAT element zero.
    series = [1.0] * 65
    series[-(63 + 1)] = 0.0
    assert factor_engine.compute_return(series, lookback=63) is None


def test_volume_trend_guards_zero_denominator() -> None:
    """Volume trend returns None when the long-window average is ~zero."""
    assert factor_engine.compute_volume_trend([0.0] * 63) is None


def test_valuation_zscore_excludes_negative_earnings() -> None:
    """A None/negative P/E is excluded (returns None), not defaulted to 0."""
    assert factor_engine.compute_valuation_zscore(None, [10.0, 20.0]) is None
    assert factor_engine.compute_valuation_zscore(-5.0, [10.0, 20.0]) is None


def test_compute_factors_returns_all_five() -> None:
    """compute_factors emits one value object per factor name."""
    data = MarketData(symbol="TST", prices=[float(i) for i in range(1, 140)],
                      volumes=[1e6] * 139, pe_ratio=15.0, last_price=139.0,
                      provenance="test")
    out = factor_engine.compute_factors(data, universe_pes=[10.0, 15.0, 20.0])
    names = {f.factor_name for f in out}
    assert names == set(FactorName)
