'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { useGeoStore } from '@/store/useGeoStore'
import EventFeed from '@/components/events/EventFeed'
import EventPanel from '@/components/events/EventPanel'
import MarketsView from '@/components/markets/MarketsView'
import { getBrowserClient, type EventWithAnalysis } from '@/lib/supabase'
// getBrowserClient is used only for the Realtime subscription channel (not for data fetching)
import type { Ticker } from '@geomarket/types'

const GlobeView = dynamic(() => import('@/components/globe/GlobeView'), { ssr: false })

type Tab = 'globe' | 'markets'

interface Props {
  initialEvents: EventWithAnalysis[]
  initialTickers: Ticker[]
}

export default function GeoMarketClient({ initialEvents, initialTickers }: Props) {
  const [events, setEvents] = useState<EventWithAnalysis[]>(initialEvents)
  const [tickers] = useState<Ticker[]>(initialTickers)
  const [activeTab, setActiveTab] = useState<Tab>('globe')
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null)
  const { selectedEvent, setSelectedEvent, clearSelectedEvent } = useGeoStore()

  // Poll every 20 s to pick up analyses created after initial page load.
  // Realtime would be cleaner but requires RLS SELECT policies.
  useEffect(() => {
    const poll = async () => {
      const res = await fetch('/api/events')
      if (!res.ok) return
      const fresh: EventWithAnalysis[] = await res.json()
      setEvents(fresh)
    }
    const id = setInterval(poll, 20_000)
    return () => clearInterval(id)
  }, [])

  // Realtime: subscribe to event_analyses inserts.
  // Re-fetch via the server API route so the service key bypasses RLS.
  useEffect(() => {
    const supabase = getBrowserClient()
    const channel = supabase
      .channel('event_analyses_inserts')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_analyses' },
        async (payload) => {
          const eventId = (payload.new as { event_id: string }).event_id
          const res = await fetch(`/api/event/${eventId}`)
          if (!res.ok) return
          const incoming = await res.json() as EventWithAnalysis
          setEvents((prev) => {
            const idx = prev.findIndex((e) => e.id === incoming.id)
            if (idx !== -1) {
              const next = [...prev]
              next[idx] = incoming
              return next
            }
            return [incoming, ...prev].slice(0, 50)
          })
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  // Show events that are pending analysis OR confirmed to have market impact.
  // Hide only events explicitly analysed as having zero market impact.
  const marketEvents = events.filter((e) => {
    const analysis = e.event_analyses?.[0]
    if (!analysis) return true  // pending — keep visible
    return (analysis.affected_tickers as any[]).length > 0
  })

  // Filter by selected ticker when active
  const feedEvents = selectedTicker
    ? marketEvents.filter((e) =>
        (e.event_analyses?.[0]?.affected_tickers as any[])?.some(
          (t) => t.symbol === selectedTicker
        )
      )
    : marketEvents

  const handleTickerSelect = (symbol: string | null) => {
    setSelectedTicker(symbol)
    // Switching to globe tab when a ticker is selected lets users see affected pins
    if (symbol) setActiveTab('globe')
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-[#030712]">
      {/* Top navbar */}
      <nav className="fixed top-0 left-0 right-0 h-10 bg-gray-950/90 backdrop-blur-md border-b border-gray-800 z-20 flex items-center px-4 gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white font-bold text-xs tracking-[0.15em] uppercase">GeoMarket</span>
        </div>

        <div className="flex items-center gap-0.5">
          {(['globe', 'markets'] as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {selectedTicker && (
          <div className="flex items-center gap-1.5 ml-2">
            <span className="text-gray-500 text-xs">Filtering:</span>
            <span className="text-white font-mono text-xs font-semibold">{selectedTicker}</span>
            <button
              onClick={() => setSelectedTicker(null)}
              className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
            >
              ✕
            </button>
          </div>
        )}
      </nav>

      {/* Globe — always mounted so it doesn't reload when switching tabs */}
      <div className={activeTab === 'globe' ? 'block' : 'hidden'}>
        <GlobeView
          events={marketEvents}
          selectedEvent={selectedEvent}
          onEventSelect={setSelectedEvent}
        />
      </div>

      {/* Markets view */}
      {activeTab === 'markets' && (
        <MarketsView
          tickers={tickers}
          selectedTicker={selectedTicker}
          onTickerSelect={handleTickerSelect}
        />
      )}

      {/* Left sidebar — always visible */}
      <EventFeed
        events={feedEvents}
        selectedEvent={selectedEvent}
        onEventSelect={setSelectedEvent}
      />

      {/* Right panel — slides in on event selection */}
      {selectedEvent && (
        <EventPanel event={selectedEvent} onClose={clearSelectedEvent} />
      )}
    </div>
  )
}
