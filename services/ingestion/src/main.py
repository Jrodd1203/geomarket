"""Entry point — APScheduler cron that runs the ingestion pipeline every 15 minutes."""

import asyncio
import logging
import os
from pathlib import Path

from apscheduler.schedulers.asyncio import AsyncIOScheduler

from .analyzer import analyze_event
from .db import upsert_analysis, upsert_event, upsert_ticker
from .gdelt import fetch_recent_events
from .polygon import fetch_prices

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

_WATCHLIST = [
    "XOM", "CVX", "RTX", "LMT", "BA",
    "GS", "JPM", "UNG", "USO", "GLD", "TLT", "EEM",
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

    prices = await fetch_prices(_WATCHLIST)
    logger.info("Fetched prices for %d/%d watchlist tickers", len(prices), len(_WATCHLIST))

    completed = 0
    for event in events:
        try:
            event_id = await upsert_event(event)
            logger.info("Upserted event %s — %.60s", event_id, event.title)

            analysis = await analyze_event(event_id, event)
            if analysis is None:
                continue

            await upsert_analysis(analysis)

            for ticker in analysis.affected_tickers:
                price = prices.get(ticker.symbol)
                if price is not None:
                    await upsert_ticker(ticker.symbol, ticker.name, None, price)

            completed += 1
            logger.info(
                "Analysed event %s — risk=%s tickers=%d",
                event_id,
                analysis.risk_level,
                len(analysis.affected_tickers),
            )

        except Exception as exc:
            logger.error("Failed to process '%.60s': %s", event.title, exc)

    logger.info("=== Pipeline complete — %d/%d events analysed ===", completed, len(events))


def main() -> None:
    _load_env()

    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_pipeline, "interval", minutes=15)
    scheduler.start()
    logger.info("Scheduler started — pipeline runs every 15 minutes")

    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down")


if __name__ == "__main__":
    main()
