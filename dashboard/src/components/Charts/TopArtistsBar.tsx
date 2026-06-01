import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useDashboardStore } from '@/store/dashboardStore'
import type { EnrichedTrack } from '@/types/spotify'

interface TopArtistsBarProps {
  tracks: EnrichedTrack[]   // always receives ALL tracks so list stays complete
  limit?: number
}

export function TopArtistsBar({ tracks, limit = 10 }: TopArtistsBarProps) {
  const { filters, setArtistFilter } = useDashboardStore()
  const activeArtist = filters.artistFilter

  const artists = useMemo(() => {
    const counts = new Map<string, { name: string; plays: number }>()
    for (const t of tracks) {
      for (const a of t.track.artists) {
        const existing = counts.get(a.id)
        if (existing) {
          existing.plays += t.playCount
        } else {
          counts.set(a.id, { name: a.name, plays: t.playCount })
        }
      }
    }
    return [...counts.values()]
      .sort((a, b) => b.plays - a.plays)
      .slice(0, limit)
  }, [tracks, limit])

  const max = artists[0]?.plays ?? 1

  function handleClick(name: string) {
    // Toggle: clicking the active artist clears the filter
    setArtistFilter(activeArtist === name ? null : name)
  }

  return (
    <div className="space-y-1.5">
      {artists.map((artist, i) => {
        const isActive = activeArtist === artist.name
        const isDimmed = activeArtist !== null && !isActive

        return (
          <motion.button
            key={artist.name}
            onClick={() => handleClick(artist.name)}
            whileHover={{ x: 2 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className={`w-full flex items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors ${
              isActive
                ? 'bg-spotify-green/15 ring-1 ring-spotify-green/50'
                : 'hover:bg-white/5'
            } ${isDimmed ? 'opacity-30' : ''}`}
          >
            {/* Rank */}
            <span
              className={`text-xs w-4 text-right flex-shrink-0 font-medium ${
                isActive ? 'text-spotify-green' : 'text-spotify-text'
              }`}
            >
              {i + 1}
            </span>

            {/* Name */}
            <span
              className={`text-xs w-28 truncate flex-shrink-0 ${
                isActive ? 'text-white font-semibold' : 'text-white'
              }`}
            >
              {artist.name}
            </span>

            {/* Bar */}
            <div className="flex-1 bg-spotify-border rounded-full h-1.5 overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isActive ? 'bg-spotify-green' : 'bg-spotify-green/60'}`}
                initial={{ width: 0 }}
                animate={{ width: `${(artist.plays / max) * 100}%` }}
                transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
              />
            </div>

            {/* Play count */}
            <span className="text-xs text-spotify-text w-6 text-right flex-shrink-0">
              {artist.plays}
            </span>

            {/* Active indicator */}
            {isActive && (
              <span className="text-spotify-green text-xs flex-shrink-0">✕</span>
            )}
          </motion.button>
        )
      })}

      {activeArtist && (
        <p className="text-xs text-spotify-text text-center pt-1">
          Click artist again to clear filter
        </p>
      )}
    </div>
  )
}
