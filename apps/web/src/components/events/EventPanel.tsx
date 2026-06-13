'use client'

import { useEffect, useState } from 'react'
import type { EventWithAnalysis } from '@/lib/supabase'
import type { AffectedTicker } from '@geomarket/types'

const RISK_BADGE: Record<string, string> = {
  low:      'text-green-400  bg-green-400/10  border-green-400/30',
  medium:   'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  high:     'text-orange-400 bg-orange-400/10 border-orange-400/30',
  critical: 'text-red-400    bg-red-400/10    border-red-400/30',
}

const RISK_BAR: Record<string, string> = {
  low: 'bg-green-400', medium: 'bg-yellow-400', high: 'bg-orange-400', critical: 'bg-red-400',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Sparkline ────────────────────────────────────────────────────────────────

function Sparkline({ ticker }: { ticker: AffectedTicker }) {
  const [closes, setCloses] = useState<number[]>([])
  const [done, setDone] = useState(false)
  const assetType = ticker.asset_type ?? 'stock'

  useEffect(() => {
    fetch(`/api/chart?symbol=${encodeURIComponent(ticker.symbol)}&asset_type=${assetType}&range=1M`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.bars) setCloses(d.bars.map((b: any) => b.c)) })
      .catch(() => {})
      .finally(() => setDone(true))
  }, [ticker.symbol, assetType])

  if (!done) {
    return <div className="w-full h-10 rounded bg-gray-800/60 animate-pulse" />
  }
  if (closes.length < 2) return null

  const min = Math.min(...closes)
  const max = Math.max(...closes)
  const range = max - min || 1
  const W = 300
  const H = 40
  const isUp = closes[closes.length - 1] >= closes[0]
  const color = isUp ? '#22c55e' : '#ef4444'
  const fillColor = isUp ? '#22c55e18' : '#ef444418'

  const pts = closes.map((c, i) => {
    const x = (i / (closes.length - 1)) * W
    const y = H - ((c - min) / range) * (H - 4) - 2
    return `${x.toFixed(1)},${y.toFixed(1)}`
  })

  const areaPath = `M${pts[0]} L${pts.join(' L')} L${W},${H} L0,${H} Z`
  const linePath = `M${pts.join(' L')}`

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: 40 }}
    >
      <path d={areaPath} fill={fillColor} />
      <path d={linePath} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  )
}

// ── Live price ────────────────────────────────────────────────────────────────

function LivePrice({ symbol }: { symbol: string }) {
  const [data, setData] = useState<{ price: number; changePercent: number } | null>(null)

  useEffect(() => {
    fetch(`/api/price?symbol=${encodeURIComponent(symbol)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => {})
  }, [symbol])

  if (!data) return <span className="text-gray-700 text-xs">—</span>
  const up = data.changePercent >= 0
  return (
    <span className="flex items-baseline gap-1.5">
      <span className="text-white font-mono text-sm font-semibold">
        ${data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      <span className={`text-xs font-medium ${up ? 'text-green-400' : 'text-red-400'}`}>
        {up ? '+' : ''}{data.changePercent.toFixed(2)}%
      </span>
    </span>
  )
}

// ── Ticker card ───────────────────────────────────────────────────────────────

function TickerCard({ ticker, riskLevel }: { ticker: AffectedTicker; riskLevel: string }) {
  const isUp   = ticker.expected_direction === 'up'
  const isDown = ticker.expected_direction === 'down'
  const dirColor = isUp ? 'text-green-400' : isDown ? 'text-red-400' : 'text-gray-400'

  return (
    <div className="bg-gray-900/60 rounded-lg border border-gray-800 overflow-hidden">
      {/* Header row */}
      <div className="flex items-center justify-between px-3 pt-3 pb-1">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-white font-mono font-bold text-sm shrink-0">{ticker.symbol}</span>
          <span className="text-gray-500 text-xs truncate">{ticker.name}</span>
        </div>
        <span className={`font-bold text-lg leading-none shrink-0 ml-2 ${dirColor}`}>
          {isUp ? '↑' : isDown ? '↓' : '→'}
        </span>
      </div>

      {/* Price row */}
      <div className="flex items-center justify-between px-3 pb-2">
        <LivePrice symbol={ticker.symbol} />
        <span className="text-gray-600 text-xs">
          {Math.round(ticker.confidence * 100)}% confidence
        </span>
      </div>

      {/* Sparkline */}
      <div className="px-0">
        <Sparkline ticker={ticker} />
      </div>

      {/* Confidence bar + rationale */}
      <div className="px-3 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-800 rounded-full h-1">
            <div
              className={`h-1 rounded-full ${RISK_BAR[riskLevel] ?? 'bg-gray-500'}`}
              style={{ width: `${Math.round(ticker.confidence * 100)}%` }}
            />
          </div>
        </div>
        <p className="text-gray-400 text-xs leading-relaxed">{ticker.rationale}</p>
      </div>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────

interface EventPanelProps {
  event: EventWithAnalysis
  onClose: () => void
}

export default function EventPanel({ event, onClose }: EventPanelProps) {
  const [visible, setVisible] = useState(false)
  const analysis = event.event_analyses?.[0]

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={`fixed right-0 top-10 bottom-0 w-[420px] bg-gray-950/97 backdrop-blur-md border-l border-gray-800 z-10 flex flex-col transition-transform duration-300 ease-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-start justify-between gap-3 mb-2">
          {analysis && (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border tracking-widest shrink-0 ${RISK_BADGE[analysis.risk_level]}`}>
              {analysis.risk_level.toUpperCase()} RISK
            </span>
          )}
          <button
            onClick={onClose}
            className="ml-auto text-gray-500 hover:text-white transition-colors p-1 hover:bg-gray-800 rounded shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <h2 className="text-white font-semibold text-sm leading-snug mb-1.5">{event.title}</h2>
        <p className="text-gray-500 text-xs">
          {[event.country, event.region, formatDate(event.occurred_at)].filter(Boolean).join(' · ')}
        </p>

        {event.source_url && (
          <a
            href={event.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-blue-500 hover:text-blue-400 text-xs mt-2 transition-colors"
          >
            Source
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">

          {/* AI summary */}
          {analysis?.summary ? (
            <div className="bg-gray-900/70 rounded-lg p-3.5 border border-gray-800">
              <div className="flex items-center gap-1.5 mb-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <p className="text-blue-400 text-xs font-semibold uppercase tracking-widest">AI Analysis</p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          ) : (
            <div className="bg-gray-900/40 rounded-lg p-3.5 border border-gray-800/50">
              <p className="text-gray-600 text-xs">Analysis pending — pipeline will process this event shortly.</p>
            </div>
          )}

          {/* Affected markets */}
          {analysis && analysis.affected_tickers.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-semibold mb-3">
                Potentially Affected Markets ({analysis.affected_tickers.length})
              </p>
              <div className="space-y-3">
                {analysis.affected_tickers.map((ticker: any) => (
                  <TickerCard key={ticker.symbol} ticker={ticker} riskLevel={analysis.risk_level} />
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
