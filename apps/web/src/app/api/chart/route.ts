import { NextRequest, NextResponse } from 'next/server'
import type { AssetType } from '@geomarket/types'

type Range = '1D' | '1W' | '1M' | '3M'

interface Bar {
  t: number  // ms since epoch
  o: number
  h: number
  l: number
  c: number
  v: number
}

function toYMD(d: Date): string {
  return d.toISOString().split('T')[0]
}

function rangeParams(range: Range): { multiplier: number; timespan: string; from: string; to: string } {
  const to = toYMD(new Date())
  const now = Date.now()
  switch (range) {
    case '1D':
      return { multiplier: 5,  timespan: 'minute', from: toYMD(new Date(now - 5  * 864e5)), to }
    case '1W':
      return { multiplier: 30, timespan: 'minute', from: toYMD(new Date(now - 7  * 864e5)), to }
    case '1M':
      return { multiplier: 1,  timespan: 'day',    from: toYMD(new Date(now - 30 * 864e5)), to }
    case '3M':
      return { multiplier: 1,  timespan: 'day',    from: toYMD(new Date(now - 90 * 864e5)), to }
  }
}

function toPolygonTicker(symbol: string, assetType: AssetType): string {
  switch (assetType) {
    case 'crypto':    return `X:${symbol}USD`
    case 'forex':     return `C:${symbol}`
    default:          return symbol  // stock, commodity (ETFs)
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const symbol    = searchParams.get('symbol')
  const assetType = (searchParams.get('asset_type') ?? 'stock') as AssetType
  const range     = (searchParams.get('range') ?? '1M') as Range

  if (!symbol) return NextResponse.json({ error: 'symbol required' }, { status: 400 })

  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'POLYGON_API_KEY not set' }, { status: 500 })

  const polygonTicker = toPolygonTicker(symbol, assetType)
  const { multiplier, timespan, from, to } = rangeParams(range)
  const url = `https://api.polygon.io/v2/aggs/ticker/${polygonTicker}/range/${multiplier}/${timespan}/${from}/${to}?adjusted=true&sort=asc&limit=500&apiKey=${apiKey}`

  try {
    const res = await fetch(url, { next: { revalidate: 60 } })
    if (!res.ok) {
      return NextResponse.json({ error: `Polygon ${res.status}` }, { status: res.status })
    }
    const json = await res.json()
    const bars: Bar[] = (json.results ?? []).map((r: any) => ({
      t: r.t, o: r.o, h: r.h, l: r.l, c: r.c, v: r.v,
    }))
    return NextResponse.json({ symbol, bars, range })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
