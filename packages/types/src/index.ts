export interface Event {
  id: string
  gdelt_id: string
  title: string
  description: string | null
  lat: number | null
  lng: number | null
  country: string | null
  region: string | null
  event_type: string | null
  source_url: string | null
  occurred_at: string | null
  ingested_at: string
}

export type AssetType = 'stock' | 'crypto' | 'forex' | 'commodity'

export interface AffectedTicker {
  symbol: string
  name: string
  asset_type?: AssetType
  expected_direction: 'up' | 'down' | 'neutral'
  rationale: string
  confidence: number
}

export interface EventAnalysis {
  id: string
  event_id: string
  affected_tickers: AffectedTicker[]
  summary: string
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  model_version: string
  created_at: string
}

export interface Ticker {
  symbol: string
  name: string | null
  sector: string | null
  asset_type: AssetType
  last_price: number | null
  last_updated: string | null
}
