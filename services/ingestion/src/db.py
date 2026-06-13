"""Supabase write helpers."""

import asyncio
import logging
import os
from datetime import datetime, timezone
from uuid import UUID

from supabase import Client, create_client

from .models import EventAnalysis, GdeltEvent

logger = logging.getLogger(__name__)

_client: Client | None = None


def _get_client() -> Client:
    global _client
    if _client is None:
        _client = create_client(
            os.environ["SUPABASE_URL"],
            os.environ["SUPABASE_SERVICE_KEY"],
        )
    return _client


# ---------------------------------------------------------------------------
# Sync helpers — run via asyncio.to_thread so the async API stays clean
# ---------------------------------------------------------------------------

def _sync_upsert_event(event: GdeltEvent) -> UUID:
    client = _get_client()
    data = {
        "gdelt_id": event.gdelt_id,
        "title": event.title,
        "description": event.description,
        "lat": event.lat,
        "lng": event.lng,
        "country": event.country,
        "region": event.region,
        "event_type": event.event_type,
        "source_url": str(event.source_url) if event.source_url else None,
        "occurred_at": event.occurred_at.isoformat() if event.occurred_at else None,
        "ingested_at": datetime.now(timezone.utc).isoformat(),
    }
    result = client.table("events").upsert(data, on_conflict="gdelt_id").execute()
    return UUID(result.data[0]["id"])


def _sync_upsert_analysis(analysis: EventAnalysis) -> None:
    client = _get_client()
    # event_analyses has no unique constraint on event_id — guard at app level
    existing = (
        client.table("event_analyses")
        .select("id")
        .eq("event_id", str(analysis.event_id))
        .execute()
    )
    if existing.data:
        logger.debug("Analysis already exists for event %s — skipping", analysis.event_id)
        return

    client.table("event_analyses").insert(
        {
            "event_id": str(analysis.event_id),
            "affected_tickers": [t.model_dump() for t in analysis.affected_tickers],
            "summary": analysis.summary,
            "risk_level": analysis.risk_level,
            "model_version": analysis.model_version,
        }
    ).execute()


_VALID_ASSET_TYPES = {"stock", "crypto", "forex", "commodity"}


def _sync_upsert_ticker(
    symbol: str,
    name: str,
    sector: str | None,
    price: float | None,
    asset_type: str = "stock",
) -> None:
    if asset_type not in _VALID_ASSET_TYPES:
        asset_type = "stock"
    data: dict = {
        "symbol": symbol,
        "name": name,
        "sector": sector,
        "asset_type": asset_type,
        "last_updated": datetime.now(timezone.utc).isoformat(),
    }
    if price is not None:
        data["last_price"] = price
    _get_client().table("tickers").upsert(data, on_conflict="symbol").execute()


# ---------------------------------------------------------------------------
# Async public API
# ---------------------------------------------------------------------------

async def upsert_event(event: GdeltEvent) -> UUID:
    return await asyncio.to_thread(_sync_upsert_event, event)


async def upsert_analysis(analysis: EventAnalysis) -> None:
    await asyncio.to_thread(_sync_upsert_analysis, analysis)


async def upsert_ticker(
    symbol: str,
    name: str,
    sector: str | None,
    price: float | None,
    asset_type: str = "stock",
) -> None:
    await asyncio.to_thread(_sync_upsert_ticker, symbol, name, sector, price, asset_type)
