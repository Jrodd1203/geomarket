from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, HttpUrl


class GdeltEvent(BaseModel):
    gdelt_id: str
    title: str
    description: str | None = None
    lat: float | None = None
    lng: float | None = None
    country: str | None = None
    region: str | None = None
    event_type: str | None = None
    source_url: str | None = None
    occurred_at: datetime | None = None


class AffectedTicker(BaseModel):
    symbol: str
    name: str
    expected_direction: str  # "up" | "down" | "neutral"
    rationale: str
    confidence: float  # 0.0 – 1.0


class EventAnalysis(BaseModel):
    event_id: UUID
    affected_tickers: list[AffectedTicker]
    summary: str
    risk_level: str  # "low" | "medium" | "high" | "critical"
    model_version: str
