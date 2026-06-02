"""Supabase write helpers."""
from uuid import UUID

from .models import EventAnalysis, GdeltEvent


async def upsert_event(event: GdeltEvent) -> UUID:
    raise NotImplementedError


async def upsert_analysis(analysis: EventAnalysis) -> None:
    raise NotImplementedError


async def upsert_ticker(symbol: str, name: str, sector: str | None, price: float) -> None:
    raise NotImplementedError
