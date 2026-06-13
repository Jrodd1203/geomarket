'use client'

import type { EventWithAnalysis } from '@/lib/supabase'

const RISK_DOT: Record<string, string> = {
  low: 'bg-green-400',
  medium: 'bg-yellow-400',
  high: 'bg-orange-500',
  critical: 'bg-red-500',
}

const RISK_LABEL: Record<string, string> = {
  low: 'text-green-400',
  medium: 'text-yellow-400',
  high: 'text-orange-400',
  critical: 'text-red-400',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

interface EventFeedProps {
  events: EventWithAnalysis[]
  selectedEvent: EventWithAnalysis | null
  onEventSelect: (event: EventWithAnalysis) => void
}

export default function EventFeed({ events, selectedEvent, onEventSelect }: EventFeedProps) {
  return (
    <div className="fixed left-0 top-10 bottom-0 w-72 bg-gray-950/85 backdrop-blur-md border-r border-gray-800 z-10 flex flex-col">
      <div className="px-3 py-2 border-b border-gray-800 shrink-0">
        <p className="text-gray-500 text-xs uppercase tracking-widest font-medium">
          Live Events — {events.length}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {events.map((event) => {
          const analysis = event.event_analyses?.[0]
          const isSelected = selectedEvent?.id === event.id

          return (
            <button
              key={event.id}
              onClick={() => onEventSelect(event)}
              className={`w-full text-left px-3 py-3 border-b border-gray-800/60 transition-all duration-150 ${
                isSelected
                  ? 'bg-gray-800/70 border-l-2 border-l-blue-500 pl-2.5'
                  : 'hover:bg-gray-900/60 border-l-2 border-l-transparent'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {analysis && (
                  <div className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${RISK_DOT[analysis.risk_level]}`} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-gray-200 text-xs font-medium leading-snug line-clamp-2">
                    {event.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    {event.country && (
                      <span className="text-gray-500 text-xs">{event.country}</span>
                    )}
                    <span className="text-gray-700 text-xs">·</span>
                    <span className="text-gray-600 text-xs" suppressHydrationWarning>{timeAgo(event.occurred_at)}</span>
                  </div>
                  {analysis && (
                    <span className={`text-xs font-medium mt-0.5 block ${RISK_LABEL[analysis.risk_level]}`}>
                      {analysis.risk_level} risk
                    </span>
                  )}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      <div className="px-4 py-2 border-t border-gray-800 shrink-0">
        <p className="text-gray-700 text-xs">Powered by GDELT · OpenAI</p>
      </div>
    </div>
  )
}
