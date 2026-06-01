import { useMemo } from 'react'
import { motion } from 'framer-motion'
import type { EnrichedTrack } from '@/types/spotify'

interface TopArtistsBarProps {
  tracks: EnrichedTrack[]
  limit?: number
}

export function TopArtistsBar({ tracks, limit = 10 }: TopArtistsBarProps) {
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

  return (
    <div className="space-y-2">
      {artists.map((artist, i) => (
        <div key={artist.name} className="flex items-center gap-3">
          <span className="text-xs text-spotify-text w-4 text-right flex-shrink-0">{i + 1}</span>
          <span className="text-xs text-white w-28 truncate flex-shrink-0">{artist.name}</span>
          <div className="flex-1 bg-spotify-border rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-spotify-green rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(artist.plays / max) * 100}%` }}
              transition={{ duration: 0.5, delay: i * 0.04, ease: 'easeOut' }}
            />
          </div>
          <span className="text-xs text-spotify-text w-6 text-right flex-shrink-0">
            {artist.plays}
          </span>
        </div>
      ))}
    </div>
  )
}
