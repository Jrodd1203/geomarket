import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const symbol = request.nextUrl.searchParams.get('symbol')
  if (!symbol) {
    return NextResponse.json({ error: 'symbol required' }, { status: 400 })
  }

  const apiKey = process.env.POLYGON_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'POLYGON_API_KEY not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(
      `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(symbol)}/prev?apiKey=${apiKey}`,
      { next: { revalidate: 60 } }
    )

    if (!res.ok) {
      return NextResponse.json({ error: 'upstream error' }, { status: res.status })
    }

    const data = await res.json()
    const result = data.results?.[0]

    if (!result) {
      return NextResponse.json({ error: 'no data for symbol' }, { status: 404 })
    }

    const change = result.c - result.o
    const changePercent = (change / result.o) * 100

    return NextResponse.json({
      symbol,
      price: result.c,
      change: parseFloat(change.toFixed(2)),
      changePercent: parseFloat(changePercent.toFixed(2)),
    })
  } catch {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 })
  }
}
