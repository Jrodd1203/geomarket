'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { Ticker, AssetType } from '@geomarket/types'

const ChartPanel = dynamic(() => import('./ChartPanel'), { ssr: false })

const ASSET_SECTION: Record<AssetType, string> = {
  crypto:    'Crypto',
  forex:     'Forex',
  commodity: 'Commodities',
  stock:     'Equities',
}

const ASSET_ORDER: AssetType[] = ['crypto', 'forex', 'commodity', 'stock']

const ASSET_BADGE: Record<AssetType, string> = {
  crypto:    'text-amber-400  bg-amber-400/10  border-amber-400/25',
  forex:     'text-cyan-400   bg-cyan-400/10   border-cyan-400/25',
  commodity: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/25',
  stock:     'text-blue-400   bg-blue-400/10   border-blue-400/25',
}

const SECTOR_COLOR: Record<string, string> = {
  Energy:   'text-orange-400 bg-orange-400/10 border-orange-400/25',
  Defense:  'text-red-400    bg-red-400/10    border-red-400/25',
  Finance:  'text-green-400  bg-green-400/10  border-green-400/25',
  Other:    'text-gray-400   bg-gray-400/10   border-gray-400/25',
}

function sectorColor(sector: string | null): string {
  if (!sector) return SECTOR_COLOR.Other
  const key = Object.keys(SECTOR_COLOR).find((k) =>
    sector.toLowerCase().includes(k.toLowerCase())
  )
  return key ? SECTOR_COLOR[key] : SECTOR_COLOR.Other
}

interface Props {
  tickers: Ticker[]
  selectedTicker: string | null
  onTickerSelect: (symbol: string | null) => void
}

export default function MarketsView({ tickers, selectedTicker, onTickerSelect }: Props) {
  const [chartTicker, setChartTicker] = useState<Ticker | null>(null)

  if (tickers.length === 0) {
    return (
      <div className="fixed left-72 top-10 right-0 bottom-0 bg-gray-950 z-[5] flex flex-col items-center justify-center gap-3">
        <div className="w-12 h-12 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center">
          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        </div>
        <p className="text-gray-500 text-sm text-center max-w-xs">
          No market data yet — run the ingestion pipeline
        </p>
      </div>
    )
  }

  // Group: non-stock types flat; stocks grouped by sector
  const grouped = ASSET_ORDER.reduce<Record<string, { label: string; items: Ticker[] }>>((acc, type) => {
    const items = tickers.filter((t) => (t.asset_type ?? 'stock') === type)
    if (!items.length) return acc

    if (type === 'stock') {
      const bySector: Record<string, Ticker[]> = {}
      for (const t of items) {
        const s = t.sector ?? 'Other'
        ;(bySector[s] ??= []).push(t)
      }
      for (const [sector, sItems] of Object.entries(bySector).sort(([a], [b]) => a.localeCompare(b))) {
        acc[`stock_${sector}`] = { label: sector, items: sItems }
      }
    } else {
      acc[type] = { label: ASSET_SECTION[type], items }
    }
    return acc
  }, {})

  return (
    <div className="fixed left-72 top-10 right-0 bottom-0 bg-gray-950 z-[5] overflow-y-auto">
      {selectedTicker && (
        <div className="sticky top-0 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-6 py-2 flex items-center gap-2 z-10">
          <span className="text-gray-400 text-xs">Filtering events by</span>
          <span className="text-white font-mono font-semibold text-xs">{selectedTicker}</span>
          <button
            onClick={() => onTickerSelect(null)}
            className="ml-1 text-gray-600 hover:text-gray-400 text-xs transition-colors"
          >
            ✕ clear
          </button>
        </div>
      )}

      <div className="p-6 space-y-8">
        {Object.entries(grouped).map(([key, { label, items }]) => {
          const assetType = key.startsWith('stock_') ? 'stock' : (key as AssetType)
          const isSectorGroup = key.startsWith('stock_')
          const sectionLabel = isSectorGroup ? label : ASSET_SECTION[assetType as AssetType]
          const isFirstInSection = !isSectorGroup || !Object.keys(grouped).some(
            (k) => k.startsWith('stock_') && k < key
          )

          return (
            <div key={key}>
              <div className="flex items-center gap-2 mb-4">
                {!isSectorGroup && (
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${ASSET_BADGE[assetType as AssetType]}`}>
                    {sectionLabel}
                  </span>
                )}
                {isSectorGroup && (
                  <>
                    {isFirstInSection && (
                      <span className={`px-2 py-0.5 rounded text-xs font-bold border ${ASSET_BADGE.stock}`}>
                        Equities
                      </span>
                    )}
                    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${sectorColor(label)}`}>
                      {label}
                    </span>
                  </>
                )}
                <span className="text-gray-700 text-xs">
                  {items.length} ticker{items.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="grid grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3">
                {items.map((ticker) => {
                  const isChart    = chartTicker?.symbol === ticker.symbol
                  const isFiltered = selectedTicker === ticker.symbol
                  return (
                    <button
                      key={ticker.symbol}
                      onClick={() => setChartTicker(isChart ? null : ticker)}
                      className={`text-left p-4 rounded-lg border transition-all duration-150 ${
                        isChart
                          ? 'bg-gray-800 border-white/20 ring-1 ring-white/10'
                          : isFiltered
                          ? 'bg-gray-900 border-blue-500/50'
                          : 'bg-gray-900/60 border-gray-800 hover:border-gray-700 hover:bg-gray-900'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="text-white font-mono font-bold text-xl leading-none">
                          {ticker.symbol}
                        </span>
                        {ticker.last_price != null && (
                          <span className="text-gray-300 font-mono text-sm shrink-0">
                            {assetType === 'forex'
                              ? ticker.last_price.toFixed(4)
                              : `$${ticker.last_price.toFixed(2)}`}
                          </span>
                        )}
                      </div>
                      {ticker.name && (
                        <p className="text-gray-500 text-xs leading-snug line-clamp-1 mb-2">
                          {ticker.name}
                        </p>
                      )}
                      <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${ASSET_BADGE[assetType as AssetType]}`}>
                        {isSectorGroup ? label : ASSET_SECTION[assetType as AssetType]}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {chartTicker && (
        <ChartPanel
          ticker={chartTicker}
          onClose={() => setChartTicker(null)}
          onFilterGlobe={(symbol) => { onTickerSelect(symbol); setChartTicker(null) }}
        />
      )}
    </div>
  )
}
