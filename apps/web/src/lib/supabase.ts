import { createBrowserClient } from '@supabase/ssr'
import type { Event, EventAnalysis } from '@geomarket/types'

export type EventWithAnalysis = Event & { event_analyses: EventAnalysis[] }

export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
