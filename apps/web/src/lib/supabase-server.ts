import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { EventWithAnalysis } from './supabase'

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
            // Server Component — cookie writes are a no-op here
          }
        },
      },
    }
  )
}

export async function getTickers() {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('tickers')
    .select('*')
    .order('symbol')
  if (error) throw error
  return data ?? []
}

export async function getEvents(): Promise<EventWithAnalysis[]> {
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, event_analyses(*)')
    .order('ingested_at', { ascending: false })
    .limit(100)

  if (error) throw error
  return (data ?? []).map((e) => ({
    ...e,
    event_analyses: e.event_analyses ?? [],
  })) as EventWithAnalysis[]
}
