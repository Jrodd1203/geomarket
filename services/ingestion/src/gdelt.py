"""GDELT GKG 2.0 feed fetcher and parser."""

import csv
import hashlib
import io
import logging
import zipfile
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx

from .models import GdeltEvent

logger = logging.getLogger(__name__)

_LASTUPDATE = "http://data.gdeltproject.org/gdeltv2/lastupdate.txt"

_THEME_PREFIXES = [
    "CRISISLEX_CRISISLEXREC",
    "WARFARE",
    "SANCTION",
    "OIL",
    "NATURAL_DISASTER",
    "ECON_",
    "POLITICAL_",
]

_THEME_TO_EVENT_TYPE = {
    "WARFARE": "MILITARY",
    "SANCTION": "SANCTIONS",
    "OIL": "ENERGY",
    "NATURAL_DISASTER": "DISASTER",
    "ECON_": "ECONOMIC",
    "POLITICAL_": "POLITICAL",
    "CRISISLEX_CRISISLEXREC": "CRISIS",
}


def _matches(themes: str) -> bool:
    for theme in themes.split(";"):
        for prefix in _THEME_PREFIXES:
            if theme.startswith(prefix):
                return True
    return False


def _dominant_event_type(themes: str) -> str:
    for theme in themes.split(";"):
        for prefix, etype in _THEME_TO_EVENT_TYPE.items():
            if theme.startswith(prefix):
                return etype
    return "GENERAL"


def _parse_location(locations_str: str) -> tuple[float | None, float | None, str | None]:
    """Extract lat, lng, country from the first GKG location entry.

    GKG location format: type#name#countrycode#adm1#lat#lng#featureid
    """
    if not locations_str:
        return None, None, None
    first = locations_str.split(";")[0]
    parts = first.split("#")
    try:
        lat = float(parts[4]) if len(parts) > 4 and parts[4] else None
        lng = float(parts[5]) if len(parts) > 5 and parts[5] else None
        country = parts[2] if len(parts) > 2 and parts[2] else None
        return lat, lng, country
    except (ValueError, IndexError):
        return None, None, None


def _parse_occurred_at(record_id: str) -> datetime | None:
    try:
        return datetime.strptime(record_id[:14], "%Y%m%d%H%M%S").replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def _make_title(event_type: str, source_url: str) -> str:
    try:
        domain = urlparse(source_url).netloc.removeprefix("www.")
    except Exception:
        domain = "unknown source"
    label = event_type.replace("_", " ").title()
    return f"{label} — {domain}"


async def fetch_recent_events(lookback_minutes: int = 15) -> list[GdeltEvent]:
    async with httpx.AsyncClient(timeout=30, follow_redirects=True) as client:
        # Resolve the latest GKG file URL from the master list
        resp = await client.get(_LASTUPDATE)
        resp.raise_for_status()
        lines = resp.text.strip().splitlines()
        # lastupdate.txt: three lines (events, mentions, gkg), space-separated: size md5 url
        gkg_url = lines[2].split()[-1]
        logger.info("Fetching GKG file: %s", gkg_url)

        resp = await client.get(gkg_url)
        resp.raise_for_status()

    events: list[GdeltEvent] = []
    seen_urls: set[str] = set()

    with zipfile.ZipFile(io.BytesIO(resp.content)) as zf:
        csv_name = zf.namelist()[0]
        with zf.open(csv_name) as raw:
            reader = csv.reader(
                io.TextIOWrapper(raw, encoding="utf-8", errors="replace"),
                delimiter="\t",
            )
            for row in reader:
                if len(row) < 17:
                    continue

                themes = row[7]
                if not themes or not _matches(themes):
                    continue

                source_url = row[4]
                if not source_url or source_url in seen_urls:
                    continue
                seen_urls.add(source_url)

                lat, lng, country = _parse_location(row[9])
                event_type = _dominant_event_type(themes)
                gdelt_id = hashlib.md5(source_url.encode()).hexdigest()

                events.append(
                    GdeltEvent(
                        gdelt_id=gdelt_id,
                        title=_make_title(event_type, source_url),
                        lat=lat,
                        lng=lng,
                        country=country,
                        event_type=event_type,
                        source_url=source_url,
                        occurred_at=_parse_occurred_at(row[0]),
                    )
                )

                if len(events) >= 20:
                    break

    logger.info("Fetched %d events from GDELT GKG", len(events))
    return events
