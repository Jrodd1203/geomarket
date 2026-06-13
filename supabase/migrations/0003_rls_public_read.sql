-- This is a public read-only intelligence dashboard.
-- Allow the anon/publishable key to SELECT from all tables so browser-side
-- Realtime re-fetches and client queries work without the service key.

alter table events         enable row level security;
alter table event_analyses enable row level security;
alter table tickers        enable row level security;

create policy "public_read" on events         for select using (true);
create policy "public_read" on event_analyses for select using (true);
create policy "public_read" on tickers        for select using (true);
