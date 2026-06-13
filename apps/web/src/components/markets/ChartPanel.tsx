'use client'

import { useEffect, useRef, useState } from 'react'
import {
  createChart,
  ColorType,
  CrosshairMode,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts'
import type { Ticker } from '@geomarket/types'

type Range = '1D' | '1W' | '1M' | '3M'

interface Bar { t: number; o: number; h: number; l: number; c: number; v: number }

const ASSET_LABEL: Record<string, string> = {
  stock: 'Equity', crypto: 'Crypto', forex: 'Forex', commodity: 'Commodity',
}
const ASSET_COLOR: Record<string, string> = {
  stock:     'text-blue-400   bg-blue-400/10   border-blue-400/30',
  crypto:    'text-amber-400  bg-amber-400/10  border-amber-400/30',
  forex:     'text-cyan-400   bg-cyan-400/10   border-cyan-400/30',
  commodity: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
}

const RANGES: Range[] = ['1D', '1W', '1M', '3M']

interface Props {
  ticker: Ticker
  onClose: () => void
  onFilterGlobe?: (symbol: string) => void
}

export default function ChartPanel({ ticker, onClose, onFilterGlobe }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  const [range, setRange] = useState<Range>('1M')
  const [bars, setBars] = useState<Bar[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Slide-in animation
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)))
  }, [])

  // Fetch chart data
  useEffect(() => {
    setLoading(true)
    setError(null)
    fetch(`/api/chart?symbol=${ticker.symbol}&asset_type=${ticker.asset_type}&range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) throw new Error(d.error)
        setBars(d.bars ?? [])
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [ticker.symbol, ticker.asset_type, range])

  // Build chart
  useEffect(() => {
    if (!containerRef.current || loading || !bars.length) return

    const chart = createChart(containerRef.current, {
      autoSize: true,
      layout: {
        background: { type: ColorType.Solid, color: '#030712' },
        textColor: '#6b7280',
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#111827' },
        horzLines: { color: '#111827' },
      },
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: { borderColor: '#1f2937' },
      timeScale: {
        borderColor: '#1f2937',
        timeVisible: range === '1D' || range === '1W',
        secondsVisible: false,
      },
    })

    chart.priceScale('right').applyOptions({
      scaleMargins: { top: 0.05, bottom: 0.2 },
    })

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:        '#22c55e',
      downColor:      '#ef4444',
      borderUpColor:  '#22c55e',
      borderDownColor:'#ef4444',
      wickUpColor:    '#22c55e',
      wickDownColor:  '#ef4444',
    })

    const volSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'vol',
    })
    chart.priceScale('vol').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    })

    const candleData = bars.map((b) => ({
      time: (b.t / 1000) as any,
      open: b.o, high: b.h, low: b.l, close: b.c,
    }))
    const volData = bars.map((b) => ({
      time: (b.t / 1000) as any,
      value: b.v,
      color: b.c >= b.o ? '#22c55e28' : '#ef444428',
    }))

    candleSeries.setData(candleData)
    volSeries.setData(volData)
    chart.timeScale().fitContent()

    return () => chart.remove()
  }, [bars, loading, range])

  const lastBar = bars[bars.length - 1]
  const firstBar = bars[0]
  const priceChange = lastBar && firstBar
    ? ((lastBar.c - firstBar.o) / firstBar.o) * 100
    : null
  const isUp = priceChange !== null && priceChange >= 0
  const assetType = ticker.asset_type ?? 'stock'

  return (
    <div
      className={`fixed right-0 top-10 bottom-0 w-[520px] bg-gray-950 border-l border-gray-800 z-20
        flex flex-col transition-transform duration-300 ease-out
        ${visible ? 'translate-x-0' : 'translate-x-full'}`}
    >
      {/* Header */}
      <div className="px-5 pt-4 pb-3 border-b border-gray-800 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-white font-mono font-bold text-2xl leading-none">
                {ticker.symbol}
              </span>
              <span className={`px-1.5 py-0.5 rounded text-xs font-semibold border ${ASSET_COLOR[assetType]}`}>
                {ASSET_LABEL[assetType] ?? assetType}
              </span>
            </div>
            {ticker.name && (
              <p className="text-gray-500 text-xs mt-1 truncate">{ticker.name}</p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onFilterGlobe && (
              <button
                onClick={() => { onFilterGlobe(ticker.symbol); onClose() }}
                className="text-xs text-gray-500 hover:text-blue-400 transition-colors px-2 py-1 rounded border border-gray-800 hover:border-blue-500/40"
              >
                Filter globe
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-600 hover:text-gray-300 transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {lastBar && (
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-white font-mono text-lg font-semibold">
              {assetType === 'forex'
                ? lastBar.c.toFixed(4)
                : `$${lastBar.c.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </span>
            {priceChange !== null && (
              <span className={`text-sm font-medium ${isUp ? 'text-green-400' : 'text-red-400'}`}>
                {isUp ? '+' : ''}{priceChange.toFixed(2)}% ({range})
              </span>
            )}
          </div>
        )}
      </div>

      {/* Range tabs */}
      <div className="flex items-center gap-0.5 px-4 py-2 border-b border-gray-800 shrink-0">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              range === r
                ? 'bg-gray-800 text-white'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
            }`}
          >
            {r}
          </button>
        ))}
      </div>

      {/* Chart area */}
      <div className="flex-1 min-h-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-gray-500 text-sm">Loading…</span>
            </div>
          </div>
        )}
        {!loading && error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-600 text-sm text-center px-8">
              No chart data — {error}
            </p>
          </div>
        )}
        {!loading && !error && bars.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-600 text-sm">No data for this range</p>
          </div>
        )}
        <div ref={containerRef} className="absolute inset-0" />
      </div>

      <div className="px-4 py-2 border-t border-gray-800 shrink-0">
        <p className="text-gray-700 text-xs">Market data by Polygon.io</p>
      </div>
    </div>
  )
}
