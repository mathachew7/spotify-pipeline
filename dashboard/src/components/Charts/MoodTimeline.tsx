import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { EnrichedTrack } from '@/types/spotify'

interface MoodTimelineProps {
  tracks: EnrichedTrack[]
}

interface DayAvg {
  date: string
  energy: number
  valence: number
}

function formatDate(d: Date): string {
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function MoodTimeline({ tracks }: MoodTimelineProps) {
  const data: DayAvg[] = useMemo(() => {
    const byDay = new Map<string, { energySum: number; valenceSum: number; count: number }>()

    for (const t of tracks) {
      for (const ph of t.playHistory) {
        const d = new Date(ph.played_at)
        const key = formatDate(d)
        const existing = byDay.get(key)
        if (existing) {
          existing.energySum += t.audioFeatures.energy
          existing.valenceSum += t.audioFeatures.valence
          existing.count++
        } else {
          byDay.set(key, {
            energySum: t.audioFeatures.energy,
            valenceSum: t.audioFeatures.valence,
            count: 1,
          })
        }
      }
    }

    return [...byDay.entries()]
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .map(([date, v]) => ({
        date,
        energy: Math.round((v.energySum / v.count) * 100) / 100,
        valence: Math.round((v.valenceSum / v.count) * 100) / 100,
      }))
  }, [tracks])

  return (
    <ResponsiveContainer width="100%" height={160}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#3E3E3E" />
        <XAxis dataKey="date" tick={{ fill: '#B3B3B3', fontSize: 10 }} />
        <YAxis domain={[0, 1]} tick={{ fill: '#B3B3B3', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#282828', border: '1px solid #3E3E3E', borderRadius: 8 }}
          labelStyle={{ color: '#fff', fontSize: 11 }}
          itemStyle={{ fontSize: 11 }}
        />
        <Legend wrapperStyle={{ fontSize: 10 }} />
        <Line
          type="monotone"
          dataKey="energy"
          stroke="#EF4444"
          strokeWidth={2}
          dot={false}
          name="Avg Energy"
        />
        <Line
          type="monotone"
          dataKey="valence"
          stroke="#60A5FA"
          strokeWidth={2}
          dot={false}
          name="Avg Valence"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
