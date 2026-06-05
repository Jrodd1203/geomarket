'use client'

import { useEffect, useState } from 'react'
import type { EventWithAnalysis } from '@/lib/supabase'

const RISK_BADGE: Record<string, string> = {
  low: 'text-green-400 bg-green-400/10 border-green-400/30',
  medium: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  high: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  critical: 'text-red-400 bg-red-400/10 border-red-400/30',
}

const RISK_BAR: Record<string, string> = {
  low: 'bg-green-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-400',
  critical: 'bg-red-400',
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Unknown'
  return new Date(dateStr).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface EventPanelProps {
  event: EventWithAnalysis
  onClose: () => void
}

export default function EventPanel({ event, onClose }: EventPanelProps) {
  const [visible, setVisible] = useState(false)
  const analysis = event.event_analyses[0]

  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={`fixed right-0 top-0 h-full w-96 bg-gray-950/95 backdrop-blur-md border-l border-gray-800 z-10 flex flex-col transition-transform duration-300 ease-out ${
        visible ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="px-4 py-4 border-b border-gray-800 shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-1.5">
              Event Detail
            </p>
            <h2 className="text-white font-semibold text-sm leading-snug">{event.title}</h2>
            <p className="text-gray-500 text-xs mt-1.5">
              {event.country}
              {event.region ? ` · ${event.region}` : ''}
              {' · '}
              {formatDate(event.occurred_at)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors mt-0.5 shrink-0 p-1 hover:bg-gray-800 rounded"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {analysis && (
          <div className="mt-3">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border tracking-wide ${RISK_BADGE[analysis.risk_level]}`}
            >
              {analysis.risk_level.toUpperCase()} RISK
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-5">
          {/* Description */}
          {event.description && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-2">
                Summary
              </p>
              <p className="text-gray-300 text-sm leading-relaxed">{event.description}</p>
            </div>
          )}

          {/* AI Analysis */}
          {analysis?.summary && (
            <div className="bg-gray-900/80 rounded-lg p-3.5 border border-gray-800">
              <div className="flex items-center gap-1.5 mb-2">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                </svg>
                <p className="text-blue-400 text-xs font-medium uppercase tracking-wide">
                  AI Analysis
                </p>
              </div>
              <p className="text-gray-300 text-sm leading-relaxed">{analysis.summary}</p>
            </div>
          )}

          {/* Affected tickers */}
          {analysis && analysis.affected_tickers.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-medium mb-3">
                Market Impact
              </p>
              <div className="space-y-2.5">
                {analysis.affected_tickers.map((ticker) => {
                  const isUp = ticker.expected_direction === 'up'
                  const isDown = ticker.expected_direction === 'down'
                  const dirColor = isUp
                    ? 'text-green-400'
                    : isDown
                    ? 'text-red-400'
                    : 'text-gray-400'
                  const barColor = analysis
                    ? RISK_BAR[analysis.risk_level]
                    : 'bg-gray-400'

                  return (
                    <div
                      key={ticker.symbol}
                      className="bg-gray-900/60 rounded-lg p-3 border border-gray-800 hover:border-gray-700 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-mono font-bold text-sm">
                            {ticker.symbol}
                          </span>
                          <span className="text-gray-500 text-xs truncate max-w-[100px]">
                            {ticker.name}
                          </span>
                        </div>
                        <span className={`font-bold text-base ${dirColor}`}>
                          {isUp ? '↑' : isDown ? '↓' : '→'}
                        </span>
                      </div>

                      {/* Confidence bar */}
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex-1 bg-gray-800 rounded-full h-1">
                          <div
                            className={`h-1 rounded-full transition-all duration-500 ${barColor}`}
                            style={{ width: `${Math.round(ticker.confidence * 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-400 text-xs shrink-0 font-mono">
                          {Math.round(ticker.confidence * 100)}%
                        </span>
                      </div>

                      <p className="text-gray-400 text-xs leading-relaxed">{ticker.rationale}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
