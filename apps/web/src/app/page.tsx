import GeoMarketClient from '@/components/GeoMarketClient'
import { getEvents, getTickers } from '@/lib/supabase-server'

// Always fetch fresh — this dashboard is not a candidate for static caching
export const dynamic = 'force-dynamic'

export default async function Page() {
  const [events, tickers] = await Promise.all([
    getEvents().catch(() => []),
    getTickers().catch(() => []),
  ])
  return <GeoMarketClient initialEvents={events} initialTickers={tickers} />
}
