import { getEvents } from '@/lib/supabase'

export default async function Page() {
  const events = await getEvents()
  return (
    <main style={{ padding: '2rem' }}>
      <p>GeoMarket</p>
      <p>Events in DB: {events.length}</p>
    </main>
  )
}