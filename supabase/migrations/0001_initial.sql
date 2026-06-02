-- GeoMarket initial schema

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- events
-- ---------------------------------------------------------------------------
create table if not exists events (
  id           uuid        primary key default gen_random_uuid(),
  gdelt_id     text        unique not null,
  title        text        not null,
  description  text,
  lat          float,
  lng          float,
  country      text,
  region       text,
  event_type   text,
  source_url   text,
  occurred_at  timestamptz,
  ingested_at  timestamptz default now()
);

create index if not exists events_occurred_at_idx on events (occurred_at desc);
create index if not exists events_country_idx      on events (country);

-- ---------------------------------------------------------------------------
-- event_analyses
-- ---------------------------------------------------------------------------
create table if not exists event_analyses (
  id               uuid        primary key default gen_random_uuid(),
  event_id         uuid        references events(id) on delete cascade,
  affected_tickers jsonb       not null default '[]'::jsonb,
  summary          text,
  risk_level       text        check (risk_level in ('low', 'medium', 'high', 'critical')),
  model_version    text,
  created_at       timestamptz default now()
);

create index if not exists event_analyses_event_id_idx  on event_analyses (event_id);
create index if not exists event_analyses_risk_level_idx on event_analyses (risk_level);

-- ---------------------------------------------------------------------------
-- tickers
-- ---------------------------------------------------------------------------
create table if not exists tickers (
  symbol       text        primary key,
  name         text,
  sector       text,
  last_price   float,
  last_updated timestamptz
);
