'use client'

import { create } from 'zustand'
import type { EventWithAnalysis } from '@/lib/supabase'

interface GeoStore {
  selectedEvent: EventWithAnalysis | null
  setSelectedEvent: (event: EventWithAnalysis) => void
  clearSelectedEvent: () => void
}

export const useGeoStore = create<GeoStore>((set) => ({
  selectedEvent: null,
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  clearSelectedEvent: () => set({ selectedEvent: null }),
}))
