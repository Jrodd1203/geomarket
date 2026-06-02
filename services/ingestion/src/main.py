"""Entry point — APScheduler cron that runs the ingestion pipeline every 15 minutes."""
import asyncio

from apscheduler.schedulers.asyncio import AsyncIOScheduler


async def run_pipeline() -> None:
    raise NotImplementedError


def main() -> None:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(run_pipeline, "interval", minutes=15)
    scheduler.start()

    try:
        asyncio.get_event_loop().run_forever()
    except (KeyboardInterrupt, SystemExit):
        pass


if __name__ == "__main__":
    main()
