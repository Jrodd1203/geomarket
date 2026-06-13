"""OpenAI-powered geopolitical event analysis."""

import json
import logging
import os
from uuid import UUID

from openai import AsyncOpenAI

from .models import AffectedTicker, EventAnalysis, GdeltEvent

logger = logging.getLogger(__name__)

_MODEL = "gpt-4o"

_SYSTEM = (
    "You are a geopolitical risk analyst. Given a world event, identify which financial assets "
    "are most directly affected — including publicly traded stocks, cryptocurrencies, forex pairs, "
    "and commodity ETFs. Always respond with valid JSON only, no markdown."
)


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])


async def analyze_event(event_id: UUID, event: GdeltEvent) -> EventAnalysis | None:
    prompt = (
        f"Title: {event.title}\n"
        f"Country: {event.country or 'Unknown'}\n"
        f"Region: {event.region or 'Unknown'}\n"
        f"Event type: {event.event_type or 'General'}\n"
        f"Source: {event.source_url or 'N/A'}\n\n"
        "Does this event have a meaningful impact on financial markets? "
        "If NO (local news, crime, accident, sports, entertainment) — return {\"summary\": \"\", \"risk_level\": \"low\", \"affected_tickers\": []}. "
        "If YES, identify 2-5 affected assets: stocks, crypto (BTC/ETH/SOL), "
        "forex pairs (EURUSD/GBPUSD/USDJPY/USDCNH), or commodity ETFs (GLD/USO/UNG/SLV). "
        "Return this exact JSON structure:\n"
        '{"summary": "2-3 sentence market impact summary", '
        '"risk_level": "low|medium|high|critical", '
        '"affected_tickers": [{'
        '"symbol": "XOM", "name": "ExxonMobil Corp", "asset_type": "stock|crypto|forex|commodity", '
        '"expected_direction": "up|down|neutral", '
        '"rationale": "one sentence", "confidence": 0.82}]}'
    )

    try:
        client = _get_client()
        response = await client.chat.completions.create(
            model=_MODEL,
            messages=[
                {"role": "system", "content": _SYSTEM},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
        )

        raw = response.choices[0].message.content or "{}"
        data = json.loads(raw)

        tickers = [AffectedTicker(**t) for t in data.get("affected_tickers", [])]

        return EventAnalysis(
            event_id=event_id,
            affected_tickers=tickers,
            summary=data["summary"],
            risk_level=data["risk_level"],
            model_version=_MODEL,
        )

    except Exception as exc:
        logger.error("Analysis failed for event %s: %s", event_id, exc)
        return None
