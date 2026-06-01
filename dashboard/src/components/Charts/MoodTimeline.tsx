import { useMemo } from 'react'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'
import type { EnrichedTrack } from '@/types/spotify'

interface MoodTimelineProps {
  tracks: EnrichedTrack[]
}

interface DayAvg {
  date: string        // display label: "May 31 '26"
  isoDate: string     // for sorting
  energy: number
  valence: number
  plays: number
}

function fmtDate(d: Date): string {
  const month = d.toLocaleDateString(undefined, { month: 'short' })
  const day = d.getDate()
  const year = String(d.getFullYear()).slice(2)
  return `${month} ${day} '${year}`
}

function fmtIso(d: Date): string {
  return d.toISOString().slice(0, 10)
}

interface TooltipPayload {
  color: string
  name: string
  value: number
}

function CustomTooltip({ active, payload, label }: {
  active?: boolean
  payload?: TooltipPayload[]
  label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-spotify-card border border-spotify-border rounded-lg px-3 py-2 text-xs shadow-xl">
      <p className="text-white font-semibold mb-1.5">{label}</p>
      {payload.map((p) => (
        <div key={p.name} className="flex justify-between gap-4">
          <span style={{ color: p.color }}>{p.name}</span>
          <span className="text-white font-medium">{Math.round(p.value * 100)}%</span>
        </div>
      ))}
    </div>
  )
}

export function MoodTimeline({ tracks }: MoodTimelineProps) {
  const data: DayAvg[] = useMemo(() => {
    const byDay = new Map<string, {
      energySum: number; valenceSum: number; count: number; plays: number
    }>()

    for (const t of tracks) {
      for (const ph of t.playHistory) {
        const d = new Date(ph.played_at)
        const key = fmtIso(d)
        const label = fmtDate(d)
        const existing = byDay.get(key)
        if (existing) {
          existing.energySum += t.audioFeatures.energy
          existing.valenceSum += t.audioFeatures.valence
          existing.count++
          existing.plays++
        } else {
          byDay.set(key, {
            energySum: t.audioFeatures.energy,
            valenceSum: t.audioFeatures.valence,
            count: 1,
            plays: 1,
          })
        }
        // store label alongside key
        byDay.get(key)!
        void label   // used below via isoDate lookup
      }
    }

    return [...byDay.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([iso, v]) => {
        const d = new Date(iso)
        return {
          date: fmtDate(d),
          isoDate: iso,
          energy: Math.round((v.energySum / v.count) * 100) / 100,
          valence: Math.round((v.valenceSum / v.count) * 100) / 100,
          plays: v.plays,
        }
      })
  }, [tracks])

  if (data.length === 0) {
    return (
      <div className="h-40 flex items-center justify-center text-xs text-spotify-text">
        No plays in this time window
      </div>
    )
  }

  // Show at most 10 x-axis labels to avoid crowding
  const tickInterval = Math.max(1, Math.floor(data.length / 6)) - 1

  return (
    <ResponsiveContainer width="100%" height={165}>
      <LineChart data={data} margin={{ top: 4, right: 8, left: -22, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#B3B3B3', fontSize: 9 }}
          interval={tickInterval}
          angle={-30}
          textAnchor="end"
          height={32}
        />
        <YAxis
          domain={[0, 1]}
          tick={{ fill: '#B3B3B3', fontSize: 9 }}
          tickFormatter={(v: number) => `${Math.round(v * 100)}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
          formatter={(value) => <span style={{ color: '#B3B3B3' }}>{value}</span>}
        />
        {/* Neutral 50% reference */}
        <ReferenceLine y={0.5} stroke="#3E3E3E" strokeDasharray="4 4" />
        <Line
          type="monotone"
          dataKey="energy"
          stroke="#EF4444"
          strokeWidth={2}
          dot={{ r: 2, fill: '#EF4444' }}
          activeDot={{ r: 4 }}
          name="Avg Energy"
        />
        <Line
          type="monotone"
          dataKey="valence"
          stroke="#60A5FA"
          strokeWidth={2}
          dot={{ r: 2, fill: '#60A5FA' }}
          activeDot={{ r: 4 }}
          name="Avg Vibe"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
