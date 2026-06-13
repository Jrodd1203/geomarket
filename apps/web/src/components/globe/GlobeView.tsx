'use client'

import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import type { EventWithAnalysis } from '@/lib/supabase'

const Globe = dynamic(() => import('react-globe.gl'), { ssr: false })

const RISK_COLOR: Record<string, string> = {
  low: '#22c55e',
  medium: '#eab308',
  high: '#f97316',
  critical: '#ef4444',
}

const RISK_RADIUS: Record<string, number> = {
  low: 0.4,
  medium: 0.5,
  high: 0.6,
  critical: 0.8,
}

// lat, lng for each financial center
const FINANCIAL_CENTERS: Record<string, [number, number]> = {
  NYSE: [40.71, -74.01],
  LSE:  [51.51, -0.13],
  TSE:  [35.69, 139.69],
  SSE:  [31.23, 121.47],
  NSE:  [19.07, 72.88],
}

const EXCHANGE_MAP: Record<string, string> = {
  BP: 'LSE', SHEL: 'LSE', GSK: 'LSE', AZN: 'LSE', HSBC: 'LSE', VOD: 'LSE',
  TSM: 'TSE', TM: 'TSE', SONY: 'TSE', HMC: 'TSE', '7203': 'TSE',
  BABA: 'SSE', BIDU: 'SSE', JD: 'SSE', NIO: 'SSE', PDD: 'SSE',
  RELIANCE: 'NSE', TCS: 'NSE', INFY: 'NSE', HDFC: 'NSE', WIPRO: 'NSE', WIT: 'NSE', HDB: 'NSE',
}

function exchangeCoords(symbol: string): [number, number] {
  return FINANCIAL_CENTERS[EXCHANGE_MAP[symbol] ?? 'NYSE']
}

interface PointDatum {
  lat: number
  lng: number
  color: string
  radius: number
  event: EventWithAnalysis
}

interface ArcDatum {
  startLat: number
  startLng: number
  endLat: number
  endLng: number
  color: string
}

interface GlobeViewProps {
  events: EventWithAnalysis[]
  selectedEvent: EventWithAnalysis | null
  onEventSelect: (event: EventWithAnalysis) => void
}

export default function GlobeView({ events, selectedEvent, onEventSelect }: GlobeViewProps) {
  const globeRef = useRef<any>(null)
  const [dims, setDims] = useState({ w: 0, h: 0 })

  useEffect(() => {
    const update = () => setDims({ w: window.innerWidth, h: window.innerHeight })
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])

  const handleGlobeReady = useCallback(() => {
    const gl = globeRef.current
    if (!gl) return
    const controls = gl.controls()
    controls.autoRotate = true
    controls.autoRotateSpeed = 0.35
    gl.pointOfView({ lat: 20, lng: 10, altitude: 2.5 }, 0)
  }, [])

  useEffect(() => {
    const gl = globeRef.current
    if (!gl) return
    try {
      const controls = gl.controls()
      controls.autoRotate = selectedEvent === null
      if (selectedEvent?.lat != null && selectedEvent?.lng != null) {
        gl.pointOfView({ lat: selectedEvent.lat, lng: selectedEvent.lng, altitude: 1.8 }, 1200)
      }
    } catch (_) { /* globe not ready yet */ }
  }, [selectedEvent])

  const pointsData: PointDatum[] = useMemo(
    () =>
      events
        .filter((e) => e.lat != null && e.lng != null)
        .map((e) => ({
          lat: e.lat!,
          lng: e.lng!,
          color: RISK_COLOR[e.event_analyses?.[0]?.risk_level ?? 'low'],
          radius: RISK_RADIUS[e.event_analyses?.[0]?.risk_level ?? 'low'],
          event: e,
        })),
    [events]
  )

  const arcsData: ArcDatum[] = useMemo(() => {
    if (selectedEvent?.lat == null || selectedEvent?.lng == null) return []
    const analysis = selectedEvent.event_analyses?.[0]
    if (!analysis) return []
    return analysis.affected_tickers.map((ticker) => {
      const [endLat, endLng] = exchangeCoords(ticker.symbol)
      const dir = ticker.expected_direction
      return {
        startLat: selectedEvent.lat!,
        startLng: selectedEvent.lng!,
        endLat,
        endLng,
        color: dir === 'up' ? '#22c55e' : dir === 'down' ? '#ef4444' : '#6b7280',
      }
    })
  }, [selectedEvent])

  const handlePointClick = useCallback(
    (point: object) => {
      onEventSelect((point as PointDatum).event)
    },
    [onEventSelect]
  )

  return (
    <div className="fixed inset-0 z-0 bg-[#030712]">
      {dims.w > 0 && (
        <Globe
          ref={globeRef}
          width={dims.w}
          height={dims.h}
          backgroundColor="#030712"
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
          atmosphereColor="#1e3a8a"
          atmosphereAltitude={0.18}
          pointsData={pointsData}
          pointLat="lat"
          pointLng="lng"
          pointColor="color"
          pointAltitude={0.01}
          pointRadius="radius"
          pointsMerge={false}
          pointLabel={(d: object) => {
            const p = d as PointDatum
            return `<div style="background:rgba(3,7,18,0.9);color:#e5e7eb;padding:6px 10px;border-radius:6px;font-size:11px;max-width:220px;border:1px solid rgba(55,65,81,0.8);line-height:1.4">${p.event.title}</div>`
          }}
          onPointClick={handlePointClick}
          arcsData={arcsData}
          arcStartLat="startLat"
          arcStartLng="startLng"
          arcEndLat="endLat"
          arcEndLng="endLng"
          arcColor={(d: object) => {
            const c = (d as ArcDatum).color
            return [c, `${c}22`]
          }}
          arcDashLength={0.4}
          arcDashGap={0.2}
          arcDashAnimateTime={2000}
          arcStroke={0.5}
          onGlobeReady={handleGlobeReady}
        />
      )}
    </div>
  )
}
