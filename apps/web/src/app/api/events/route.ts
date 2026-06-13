import { NextResponse } from 'next/server'
import { getEvents } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const events = await getEvents().catch(() => [])
  return NextResponse.json(events)
}
