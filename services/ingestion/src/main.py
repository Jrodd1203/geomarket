"""Entry point — APScheduler cron that runs the ingestion pipeline every 15 minutes."""

import asyncio
import logging
import os
from pathlib import Path

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .analyzer import analyze_event
from .db import upsert_analysis, upsert_event, upsert_ticker
from .gdelt import fetch_recent_events
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

_WATCHLIST = [
    # Equities
    {"symbol": "XOM",   "name": "ExxonMobil Corp",                        "asset_type": "stock"},
    {"symbol": "CVX",   "name": "Chevron Corp",                           "asset_type": "stock"},
    {"symbol": "RTX",   "name": "RTX Corp",                               "asset_type": "stock"},
    {"symbol": "LMT",   "name": "Lockheed Martin Corp",                   "asset_type": "stock"},
    {"symbol": "BA",    "name": "Boeing Co",                              "asset_type": "stock"},
    {"symbol": "GS",    "name": "Goldman Sachs Group",                    "asset_type": "stock"},
    {"symbol": "JPM",   "name": "JPMorgan Chase & Co",                    "asset_type": "stock"},
    {"symbol": "EEM",   "name": "iShares MSCI Emerging Markets ETF",      "asset_type": "stock"},
    {"symbol": "TLT",   "name": "iShares 20+ Year Treasury Bond ETF",     "asset_type": "stock"},
    # Commodities
    {"symbol": "GLD",   "name": "SPDR Gold Shares",                       "asset_type": "commodity"},
    {"symbol": "USO",   "name": "United States Oil Fund",                 "asset_type": "commodity"},
    {"symbol": "UNG",   "name": "United States Natural Gas Fund",         "asset_type": "commodity"},
    {"symbol": "SLV",   "name": "iShares Silver Trust",                   "asset_type": "commodity"},
    # Crypto
    {"symbol": "BTC",   "name": "Bitcoin",                                "asset_type": "crypto"},
    {"symbol": "ETH",   "name": "Ethereum",                               "asset_type": "crypto"},
    {"symbol": "SOL",   "name": "Solana",                                 "asset_type": "crypto"},
    # Forex
    {"symbol": "EURUSD","name": "Euro / US Dollar",                       "asset_type": "forex"},
    {"symbol": "GBPUSD","name": "British Pound / US Dollar",              "asset_type": "forex"},
    {"symbol": "USDJPY","name": "US Dollar / Japanese Yen",               "asset_type": "forex"},
    {"symbol": "USDCNH","name": "US Dollar / Chinese Yuan",               "asset_type": "forex"},
]


def _load_env() -> None:
    """Load .env from the service root without requiring python-dotenv."""
    env_file = Path(__file__).parent.parent / ".env"
    if not env_file.exists():
        return
    for line in env_file.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        os.environ.setdefault(key.strip(), value.strip())


async def run_pipeline() -> None:
    logger.info("=== Pipeline starting ===")

    events = await fetch_recent_events()
    logger.info("Fetched %d events from GDELT", len(events))

    completed = 0
    for event in events:
        try:
            event_id = await upsert_event(event)

            analysis = await analyze_event(event_id, event)
            if analysis is None:
                continue

            await upsert_analysis(analysis)

            for ticker in analysis.affected_tickers:
                await upsert_ticker(
                    ticker.symbol, ticker.name, None, None,
                    getattr(ticker, "asset_type", "stock") or "stock",
                )

            completed += 1
            logger.info(
                "Analysed %s — risk=%s tickers=%s",
                event_id,
                analysis.risk_level,
                [t.symbol for t in analysis.affected_tickers],
            )

        except Exception as exc:
            logger.error("Failed to process '%.60s': %s", event.title, exc)

    logger.info("=== Pipeline complete — %d/%d events analysed ===", completed, len(events))


async def _seed_watchlist() -> None:
    """Ensure every watchlist instrument exists in the tickers table with correct asset_type."""
    for item in _WATCHLIST:
        await upsert_ticker(item["symbol"], item["name"], None, None, item["asset_type"])
    logger.info("Seeded %d watchlist tickers", len(_WATCHLIST))


async def _backfill_tickers() -> None:
    """Write tickers from analyses that existed before the price-guard bug was fixed.
    Runs after _seed_watchlist so known tickers already have correct asset_type."""
    from .db import _get_client
    result = await asyncio.to_thread(
        lambda: _get_client().table("event_analyses").select("affected_tickers").execute()
    )
    seen: set[str] = set()
    for row in result.data or []:
        for t in row.get("affected_tickers") or []:
            symbol = t.get("symbol")
            if symbol and symbol not in seen:
                seen.add(symbol)
                asset_type = t.get("asset_type", "stock") or "stock"
                await upsert_ticker(symbol, t.get("name", symbol), None, None, asset_type)
    logger.info("Backfilled %d unique tickers from existing analyses", len(seen))


async def _run() -> None:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_pipeline, "interval", minutes=15)
    scheduler.start()
    logger.info("Scheduler started — pipeline runs every 15 minutes")

    await _seed_watchlist()
    await _backfill_tickers()
    await run_pipeline()

    try:
        await asyncio.Event().wait()
    except (asyncio.CancelledError, KeyboardInterrupt, SystemExit):
        pass
    finally:
        scheduler.shutdown()
        logger.info("Shutting down")


def main() -> None:
    _load_env()
    asyncio.run(_run())


if __name__ == "__main__":
    main()
