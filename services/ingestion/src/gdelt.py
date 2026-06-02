"""GDELT GKG feed fetcher and parser."""

from .models import GdeltEvent


async def fetch_recent_events(lookback_minutes: int = 15) -> list[GdeltEvent]:
    raise NotImplementedError
