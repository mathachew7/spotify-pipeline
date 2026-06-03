import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/Card'
import { ListeningHeatmap } from '@/components/Charts/ListeningHeatmap'
import { TopArtistsBar } from '@/components/Charts/TopArtistsBar'
import { MoodTimeline } from '@/components/Charts/MoodTimeline'
import type { EnrichedTrack } from '@/types/spotify'

interface SidebarProps {
  allTracks: EnrichedTrack[]       // full list — keeps artist bar complete
  filteredTracks: EnrichedTrack[]  // artist/energy filtered — drives charts
  isOpen: boolean
}

export function Sidebar({ allTracks, filteredTracks, isOpen }: SidebarProps) {
  if (!isOpen) return null

  return (
    <aside className="w-72 flex-shrink-0 bg-spotify-dark border-r border-spotify-border flex flex-col gap-3 p-3 overflow-y-auto min-h-0 h-full">
      {/* Insight banner — shows when data is filtered or always */}
      <ArtistInsight tracks={allTracks} />

      <Card title="Top Artists">
        <TopArtistsBar tracks={allTracks} limit={8} />
      </Card>

      <Card title="Listening Heatmap">
        <ListeningHeatmap tracks={filteredTracks} />
      </Card>

      <Card title="Mood Timeline">
        <MoodTimeline tracks={filteredTracks} />
      </Card>

      <StatsGrid tracks={filteredTracks} />
    </aside>
  )
}

// ── Artist Insight banner ─────────────────────────────────────────────────

function ArtistInsight({ tracks }: { tracks: EnrichedTrack[] }) {
  const insight = useMemo(() => {
    const counts = new Map<string, { name: string; plays: number }>()
    for (const t of tracks) {
      for (const a of t.track.artists) {
        const existing = counts.get(a.id)
        if (existing) existing.plays += t.playCount
        else counts.set(a.id, { name: a.name, plays: t.playCount })
      }
    }
    const sorted = [...counts.values()].sort((a, b) => b.plays - a.plays)
    const top = sorted[0]
    if (!top) return null

    const total = sorted.reduce((s, a) => s + a.plays, 0)
    const pct = Math.round((top.plays / total) * 100)
    const isObsessed = pct >= 30
    const isHeavy = pct >= 20 && !isObsessed

    return { name: top.name, plays: top.plays, pct, isObsessed, isHeavy, total }
  }, [tracks])

  if (!insight) return null

  const { name, plays, pct, isObsessed, isHeavy } = insight

  const bg = isObsessed
    ? 'bg-red-500/10 border-red-500/30'
    : isHeavy
    ? 'bg-amber-500/10 border-amber-500/30'
    : 'bg-spotify-green/10 border-spotify-green/30'

  const emoji = isObsessed ? '🔁' : isHeavy ? '🎧' : '🎵'
  const headline = isObsessed
    ? `You might be a bit obsessed`
    : isHeavy
    ? `Heavy rotation`
    : `Top pick this week`

  const textColor = isObsessed
    ? 'text-red-400'
    : isHeavy
    ? 'text-amber-400'
    : 'text-spotify-green'

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border px-3 py-2.5 ${bg}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-base leading-none">{emoji}</span>
        <span className={`text-xs font-semibold ${textColor}`}>{headline}</span>
      </div>
      <p className="text-xs text-white font-medium leading-snug">
        <span className={textColor}>{name}</span>{' '}
        <span className="text-spotify-text">
          — {plays} plays ({pct}% of your listening)
        </span>
      </p>
      {isObsessed && (
        <p className="text-xs text-spotify-text mt-1">
          Maybe explore some new artists? 😅
        </p>
      )}
    </motion.div>
  )
}

// ── Stats grid ────────────────────────────────────────────────────────────

function StatsGrid({ tracks }: { tracks: EnrichedTrack[] }) {
  const totalPlays = tracks.reduce((s, t) => s + t.playCount, 0)
  const avgEnergy = tracks.length
    ? Math.round((tracks.reduce((s, t) => s + t.audioFeatures.energy, 0) / tracks.length) * 100)
    : 0
  const avgValence = tracks.length
    ? Math.round((tracks.reduce((s, t) => s + t.audioFeatures.valence, 0) / tracks.length) * 100)
    : 0
  const uniqueArtists = new Set(tracks.flatMap((t) => t.track.artists.map((a) => a.id))).size

  return (
    <div className="grid grid-cols-2 gap-2">
      <StatCard label="Total plays" value={String(totalPlays)} />
      <StatCard label="Unique artists" value={String(uniqueArtists)} />
      <StatCard label="Avg energy" value={`${avgEnergy}%`} color="text-energy-mid" />
      <StatCard label="Avg vibe" value={`${avgValence}%`} color="text-blue-400" />
    </div>
  )
}

function StatCard({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-spotify-card rounded-lg p-3 border border-spotify-border">
      <p className="text-xs text-spotify-text">{label}</p>
      <p className={`text-lg font-bold mt-0.5 ${color}`}>{value}</p>
    </div>
  )
}
