import { NextRequest, NextResponse } from 'next/server'
import { getServerClient } from '@/lib/supabase-server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getServerClient()
  const { data, error } = await supabase
    .from('events')
    .select('*, event_analyses(*)')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...data,
    event_analyses: (data as any).event_analyses ?? [],
  })
}
