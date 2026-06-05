import { createBrowserClient, createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Event, EventAnalysis } from '@geomarket/types'

export function getBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}

export async function getServerClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Called from a Server Component — cookie writes are a no-op here
          }
        },
      },
    }
  )
}

export type EventWithAnalysis = Event & { event_analyses: EventAnalysis[] }

export async function getEvents(): Promise<EventWithAnalysis[]> {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, event_analyses(*)')
    .order('occurred_at', { ascending: false })
    .limit(50)

  if (error) throw error
  return (data ?? []) as EventWithAnalysis[]
}
