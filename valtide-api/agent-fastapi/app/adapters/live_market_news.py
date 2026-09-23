"""Live market-data and news providers backed by Yahoo Finance HTTP APIs.

File: app/adapters/live_market_news.py
Author: Sunil+Ai Assistant
Date: 2026-09-19
Description:
    Real-data implementations of the market-data and news provider
    responsibilities. They call Yahoo Finance's public JSON endpoints
    DIRECTLY via httpx (already a project dependency) rather than through
    yfinance, because the pinned yfinance release tracks a deprecated Yahoo
    endpoint and returns empty bodies. The v8 chart endpoint
    (query1.finance.yahoo.com/v8/finance/chart/<sym>) and the v1 search
    endpoint are stable and return real OHLCV + headlines.

    Both return the SAME ``MarketData`` / ``Headline`` value objects as the
    synthetic generators, so callers are unchanged; only the provenance
    stamp differs (``yahoo-live:<symbol>@<iso8601>``). Fetches are defensive:
    any failure raises so the mode facade can fall back to synthetic for
    that single symbol (logged), never aborting an 80-symbol scan.

Source: specs/arch/DDD.md §1.2/§2.2; data-source decision (2026-09-19)
"""
from __future__ import annotations

import hashlib
import logging
from datetime import UTC, datetime

import httpx

from app.domain.enums import Headline, MarketData

logger = logging.getLogger(__name__)

_CHART_URL = "https://query1.finance.yahoo.com/v8/finance/chart/{symbol}"
_SEARCH_URL = "https://query1.finance.yahoo.com/v1/finance/search"
_QUOTE_URL = "https://query1.finance.yahoo.com/v10/finance/quoteSummary/{symbol}"
# A browser-like UA avoids Yahoo's bot 403s on the public JSON endpoints.
_HEADERS = {"User-Agent": "Mozilla/5.0 (compatible; ValtideBot/1.0)"}
_TIMEOUT = 12.0


class LiveMarketDataProvider:
    """Fetches real daily OHLCV + trailing P/E from Yahoo's v8 chart API."""

    def fetch(self, symbol: str) -> MarketData:
        """Fetch real market data for one symbol.

        Args:
            symbol: Ticker symbol.

        Returns:
            A provenance-stamped MarketData with real closes, volumes,
            trailing P/E (best-effort), and last price.

        Raises:
            RuntimeError: On HTTP/parse failure or an empty series (the
                facade maps this to a per-symbol synthetic fallback).
        """
        params = {"range": "9mo", "interval": "1d"}
        try:
            with httpx.Client(timeout=_TIMEOUT, headers=_HEADERS) as client:
                resp = client.get(_CHART_URL.format(symbol=symbol), params=params)
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:  # noqa: BLE001 - normalize to RuntimeError
            raise RuntimeError(f"yahoo chart fetch failed for {symbol}: {exc}") from exc

        result = (data.get("chart", {}).get("result") or [None])[0]
        if not result:
            raise RuntimeError(f"no chart result for {symbol}")
        indicators = result.get("indicators", {}).get("quote", [{}])[0]
        closes = indicators.get("close") or []
        volumes = indicators.get("volume") or []
        prices = [round(float(c), 4) for c in closes if c is not None]
        vols = [round(float(v), 0) for v in volumes if v is not None]
        if not prices:
            raise RuntimeError(f"empty close series for {symbol}")

        pe = self._trailing_pe(symbol)
        retrieved = datetime.now(UTC).isoformat()
        logger.info("live market data for %s: %d bars, pe=%s", symbol, len(prices), pe)
        return MarketData(
            symbol=symbol, prices=prices, volumes=vols, pe_ratio=pe,
            last_price=prices[-1],
            provenance=f"yahoo-live:{symbol}@{retrieved}",
        )

    def _trailing_pe(self, symbol: str) -> float | None:
        """Best-effort trailing P/E from the quoteSummary endpoint.

        Args:
            symbol: Ticker symbol.

        Returns:
            Trailing P/E as float, or None when unavailable/non-positive.
            Never raises — P/E is optional and must not fail a scan row.
        """
        try:
            params = {"modules": "summaryDetail"}
            with httpx.Client(timeout=_TIMEOUT, headers=_HEADERS) as client:
                resp = client.get(_QUOTE_URL.format(symbol=symbol), params=params)
                if resp.status_code != 200:
                    return None
                data = resp.json()
            result = (data.get("quoteSummary", {}).get("result") or [None])[0]
            if not result:
                return None
            pe = result.get("summaryDetail", {}).get("trailingPE", {}).get("raw")
            pe = float(pe)
            return round(pe, 2) if pe and pe > 0 else None
        except Exception:  # noqa: BLE001 - P/E is optional
            return None


class LiveNewsProvider:
    """Fetches real recent headlines from Yahoo's search endpoint."""

    def fetch(self, symbol: str, empty: bool = False) -> list[Headline]:
        """Fetch real recent headlines for a symbol.

        Args:
            symbol: Ticker symbol.
            empty: When True, return [] (honored in live mode too).

        Returns:
            A list of normalized Headline objects (possibly empty — an empty
            live result is returned as-is so FR1 can reach
            INSUFFICIENT_EVIDENCE rather than fabricating news).

        Raises:
            RuntimeError: On HTTP/parse failure (facade may fall back).
        """
        if empty:
            return []
        params = {"q": symbol, "newsCount": "8", "quotesCount": "0"}
        try:
            with httpx.Client(timeout=_TIMEOUT, headers=_HEADERS) as client:
                resp = client.get(_SEARCH_URL, params=params)
                resp.raise_for_status()
                data = resp.json()
        except Exception as exc:  # noqa: BLE001 - normalize
            raise RuntimeError(f"yahoo news fetch failed for {symbol}: {exc}") from exc

        out: list[Headline] = []
        for item in data.get("news", []):
            title = item.get("title") or ""
            if not title:
                continue
            url = item.get("link") or f"https://finance.yahoo.com/quote/{symbol}"
            source = item.get("publisher") or "Yahoo Finance"
            epoch = item.get("providerPublishTime")
            try:
                published = datetime.fromtimestamp(float(epoch), tz=UTC)
            except (TypeError, ValueError, OSError):
                published = datetime.now(UTC)
            digest = hashlib.sha256(
                f"{title}{url}{published.isoformat()}".encode()).hexdigest()
            out.append(Headline(source=source, title=title, url=url,
                                published_at=published, content_hash=digest))
        logger.info("live news for %s: %d headlines", symbol, len(out))
        return out
