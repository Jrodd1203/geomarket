# GeoMarket

Geopolitical intelligence dashboard that maps real-world events to market impact in real time.

## Architecture

```
geomarket/
├── apps/
│   └── web/                    # Next.js 14 (App Router) dashboard
├── services/
│   └── ingestion/              # Python GDELT ingestion + Claude analysis
├── packages/
│   └── types/                  # Shared TypeScript types
└── supabase/
    └── migrations/             # Database schema
```

**Data flow:** GDELT feed → ingestion service (every 15 min) → Claude analysis → Supabase → Next.js dashboard via real-time subscription.

## Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (recommended) or pip
- A Supabase project
- Anthropic API key
- Polygon.io API key

## Setup

### 1. Environment variables

```bash
cp .env.example .env
# Fill in all values in .env
```

### 2. Supabase schema

Apply the migration via the Supabase CLI or dashboard SQL editor:

```bash
supabase db push
# or paste supabase/migrations/0001_initial.sql into the SQL editor
```

### 3. Next.js app

```bash
# Install dependencies (from repo root)
npm install

# Run the dev server
npm run dev -w apps/web
# or from apps/web/: npm run dev
```

App available at `http://localhost:3000`.

### 4. Python ingestion service

```bash
cd services/ingestion

# Create virtualenv and install dependencies
uv venv
uv pip install -e ".[dev]"
# or: pip install -e ".[dev]"

# Run the scheduler
python -m src.main
```

The scheduler polls GDELT every 15 minutes, sends events to Claude for analysis, and writes results to Supabase.

## Monorepo tasks (Turborepo)

```bash
npm run build   # build all packages and apps
npm run dev     # start all dev servers in parallel
npm run lint    # lint all packages
```

## Key dependencies

| Package | Purpose |
|---|---|
| `react-globe.gl` | 3-D WebGL globe (dynamic import, SSR disabled) |
| `zustand` | Global UI state |
| `@tanstack/react-query` | Server state / data fetching |
| `@supabase/supabase-js` | Realtime DB client |
| `leaflet` | 2-D map fallback |
| `anthropic` | Claude event analysis |
| `apscheduler` | 15-min ingestion cron |
| `httpx` | Async HTTP for GDELT + Polygon |
