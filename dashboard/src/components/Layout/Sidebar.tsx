import { Card } from '@/components/ui/Card'
import { ListeningHeatmap } from '@/components/Charts/ListeningHeatmap'
import { TopArtistsBar } from '@/components/Charts/TopArtistsBar'
import { MoodTimeline } from '@/components/Charts/MoodTimeline'
import type { EnrichedTrack } from '@/types/spotify'

interface SidebarProps {
  tracks: EnrichedTrack[]
  isOpen: boolean
}

export function Sidebar({ tracks, isOpen }: SidebarProps) {
  if (!isOpen) return null

  return (
    <aside className="w-72 flex-shrink-0 bg-spotify-dark border-r border-spotify-border flex flex-col gap-3 p-3 overflow-y-auto">
      <Card title="Listening Heatmap">
        <ListeningHeatmap tracks={tracks} />
      </Card>

      <Card title="Top Artists">
        <TopArtistsBar tracks={tracks} limit={8} />
      </Card>

      <Card title="Mood Timeline">
        <MoodTimeline tracks={tracks} />
      </Card>

      <StatsGrid tracks={tracks} />
    </aside>
  )
}

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
      <StatCard label="Avg valence" value={`${avgValence}%`} color="text-blue-400" />
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
