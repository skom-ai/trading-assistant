"""FR2 Stock Scanner service (STOCK-200) — zero-LLM path.

File: app/services/scanner_service.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Process-layer orchestration for FR2: load the universe, fetch market
    data per ticker, compute the four factors, then produce a deterministic
    top-10 composite ranking. This path NEVER touches the LLM adapter — a
    property asserted by the zero-LLM-call test (STOCK-203-T5).

Source: specs/arch/DDD.md §2
"""
from __future__ import annotations

import logging
from typing import Any

from app.adapters.market_news import MarketDataProvider
from app.core.config import get_settings
from app.engine import composite_scorer, factor_engine

logger = logging.getLogger(__name__)


class ScannerService:
    """Coordinates the FR2 deterministic scan."""

    def __init__(self, market: MarketDataProvider | None = None) -> None:
        """Initialize the service.

        Args:
            market: Optional MarketDataProvider override (for tests).
        """
        self._market = market or MarketDataProvider()

    def run(self, universe: list[str]) -> dict[str, Any]:
        """Run a full scan over the universe and return the top 10.

        Args:
            universe: Ticker symbols to scan (bounds-checked upstream).

        Returns:
            A response dict: weight_version, rows (rank + raw factors).
        """
        settings = get_settings()
        market = {sym: self._market.fetch(sym) for sym in universe}

        # Universe P/E population for the valuation z-score (positive only).
        universe_pes = [m.pe_ratio for m in market.values()
                        if m.pe_ratio is not None and m.pe_ratio > 0]

        factors_by_symbol = {
            sym: factor_engine.compute_factors(m, universe_pes)
            for sym, m in market.items()
        }
        rows = composite_scorer.score_and_rank(
            factors_by_symbol, settings.scanner_weight_version)

        logger.info("FR2 scan complete: %d ranked of %d universe",
                    len(rows), len(universe))
        return {
            "weight_version": settings.scanner_weight_version,
            "universe_size": len(universe),
            "rows": [self._row_dto(r, market[r.symbol].last_price) for r in rows],
        }

    def _row_dto(self, row: Any, last_price: float | None) -> dict[str, Any]:
        """Serialize one ranked row to the response DTO.

        Args:
            row: A ScannerRow.
            last_price: The ticker's most recent price.

        Returns:
            A dict exposing rank, composite, last price, and raw factors.
        """
        return {
            "symbol": row.symbol,
            "rank": row.rank,
            "composite_score": row.composite_score,
            "last_price": last_price,
            "factors": {f.factor_name.value: f.value for f in row.factors},
            "provenance": row.factors[0].data_provenance if row.factors else "",
        }
