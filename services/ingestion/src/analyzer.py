"""Claude-powered geopolitical event analysis."""
from uuid import UUID

from .models import EventAnalysis, GdeltEvent


async def analyze_event(event_id: UUID, event: GdeltEvent) -> EventAnalysis:
    raise NotImplementedError
