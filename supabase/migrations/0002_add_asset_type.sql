alter table tickers
  add column if not exists asset_type text not null default 'stock'
    check (asset_type in ('stock', 'crypto', 'forex', 'commodity'));
