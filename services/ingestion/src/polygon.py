"""Polygon.io previous-day close price fetcher."""

import asyncio
import logging
import os

import httpx

logger = logging.getLogger(__name__)

_BASE = "https://api.polygon.io"


async def fetch_price(symbol: str) -> float | None:
    api_key = os.environ.get("POLYGON_API_KEY", "")
    if not api_key:
        logger.warning("POLYGON_API_KEY not set — skipping price fetch")
        return None

    url = f"{_BASE}/v2/aggs/ticker/{symbol}/prev"
    async with httpx.AsyncClient(timeout=10) as client:
        try:
            resp = await client.get(url, params={"apiKey": api_key})
            resp.raise_for_status()
            results = resp.json().get("results", [])
            if results:
                return float(results[0]["c"])
            return None
        except Exception as exc:
            logger.error("Price fetch failed for %s: %s", symbol, exc)
            return None


async def fetch_prices(symbols: list[str]) -> dict[str, float]:
    prices = await asyncio.gather(*[fetch_price(s) for s in symbols])
    return {sym: price for sym, price in zip(symbols, prices) if price is not None}
