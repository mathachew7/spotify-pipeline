import { create } from 'zustand'
import type { EnrichedTrack, DashboardFilters, TimeRange } from '@/types/spotify'

interface DashboardState {
  selectedTrack: EnrichedTrack | null
  hoveredTrackId: string | null
  filters: DashboardFilters

  setSelectedTrack: (track: EnrichedTrack | null) => void
  setHoveredTrackId: (id: string | null) => void
  setTimeRange: (range: TimeRange) => void
  setEnergyRange: (range: [number, number]) => void
  setArtistFilter: (artist: string | null) => void
}

export const useDashboardStore = create<DashboardState>((set) => ({
  selectedTrack: null,
  hoveredTrackId: null,
  filters: {
    timeRange: '7d',
    energyRange: [0, 1],
    artistFilter: null,
  },

  setSelectedTrack: (track) => set({ selectedTrack: track }),
  setHoveredTrackId: (id) => set({ hoveredTrackId: id }),

  setTimeRange: (timeRange) =>
    set((s) => ({ filters: { ...s.filters, timeRange } })),

  setEnergyRange: (energyRange) =>
    set((s) => ({ filters: { ...s.filters, energyRange } })),

  setArtistFilter: (artistFilter) =>
    set((s) => ({ filters: { ...s.filters, artistFilter } })),
}))
