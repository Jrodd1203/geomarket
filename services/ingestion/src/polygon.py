"""Polygon.io price fetcher."""


async def fetch_price(symbol: str) -> float | None:
    raise NotImplementedError


async def fetch_prices(symbols: list[str]) -> dict[str, float]:
    raise NotImplementedError
