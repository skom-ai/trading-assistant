"""Market-data and news provider adapters (S1/S2 / STOCK-602/603).

File: app/adapters/market_news.py
Author: Sunil+Ai Assistant
Date: 2026-09-07
Description:
    Provider adapters for market data (yfinance) and news. To keep the
    platform fully functional and DETERMINISTIC offline, both default to
    a seeded synthetic generator keyed by symbol (same symbol => same
    series every run). A live path can be enabled later behind config
    without changing callers. Every value carries a provenance stamp.

Source: specs/arch/DDD.md §1.2, §2.2; specs/requirements/XR_Platform...
"""
from __future__ import annotations

import hashlib
import logging
import random
from datetime import UTC, datetime, timedelta

from app.domain.enums import Headline, MarketData

logger = logging.getLogger(__name__)

_HISTORY_DAYS = 140  # enough for 6M momentum + volume-trend windows


def _seeded_rng(symbol: str) -> random.Random:
    """Return a deterministic RNG seeded by the symbol."""
    seed = int(hashlib.sha256(symbol.encode()).hexdigest(), 16) % (2**32)
    return random.Random(seed)


class MarketDataProvider:
    """Fetches normalized, provenance-stamped market data."""

    def fetch(self, symbol: str) -> MarketData:
        """Fetch market data for one symbol (deterministic synthetic).

        Args:
            symbol: Ticker symbol.

        Returns:
            A normalized MarketData value object.
        """
        rng = _seeded_rng(symbol)
        price = rng.uniform(40, 400)
        prices, volumes = [], []
        for _ in range(_HISTORY_DAYS):
            price *= 1.0 + rng.uniform(-0.03, 0.032)  # slight upward drift
            prices.append(round(price, 4))
            volumes.append(round(rng.uniform(1e6, 5e7), 0))
        pe = None if rng.random() < 0.1 else round(rng.uniform(8, 55), 2)
        logger.debug("market data generated for %s (%d bars)", symbol, len(prices))
        # Provenance is a STABLE per-symbol descriptor so the evidence is
        # reproducible across runs (the determinism contract). Actual
        # retrieval time is recorded separately in DB columns (retrieved_at /
        # computed_at), not embedded here.
        return MarketData(
            symbol=symbol, prices=prices, volumes=volumes, pe_ratio=pe,
            last_price=prices[-1],
            provenance=f"synthetic-yfinance-v1:{symbol}",
        )


class NewsProvider:
    """Fetches normalized headlines for a ticker."""

    _TEMPLATES = [
        ("Reuters", "{s} reports quarterly earnings beat, raises guidance"),
        ("Bloomberg", "{s} unveils new product launch to strong demand"),
        ("MarketWatch", "Analysts debate whether {s} rally is already priced in"),
        ("SeekingAlpha", "{s} draws speculation and buzz amid sector rumor"),
    ]

    def fetch(self, symbol: str, empty: bool = False) -> list[Headline]:
        """Fetch recent headlines for a symbol (deterministic synthetic).

        Args:
            symbol: Ticker symbol.
            empty: When True, simulate a zero-result set (tests the
                INSUFFICIENT_EVIDENCE short-circuit).

        Returns:
            A list of normalized Headline objects (possibly empty).
        """
        if empty:
            return []
        rng = _seeded_rng(symbol + ":news")
        count = rng.randint(1, len(self._TEMPLATES))
        chosen = rng.sample(self._TEMPLATES, count)
        out: list[Headline] = []
        for i, (source, tmpl) in enumerate(chosen):
            title = tmpl.format(s=symbol)
            url = f"https://news.example/{symbol.lower()}/{i}"
            published = datetime.now(UTC) - timedelta(hours=rng.randint(1, 60))
            digest = hashlib.sha256(
                f"{title}{url}{published.isoformat()}".encode()).hexdigest()
            out.append(Headline(source=source, title=title, url=url,
                                published_at=published, content_hash=digest))
        logger.debug("news generated for %s (%d headlines)", symbol, len(out))
        return out
