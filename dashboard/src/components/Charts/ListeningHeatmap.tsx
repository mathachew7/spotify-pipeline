import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardStore } from '@/store/dashboardStore'
import type { EnrichedTrack } from '@/types/spotify'

interface ListeningHeatmapProps {
  tracks: EnrichedTrack[]
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const HOURS = Array.from({ length: 24 }, (_, i) => i)

function hourLabel(h: number): string {
  if (h === 0) return '12am'
  if (h === 12) return '12pm'
  return h < 12 ? `${h}am` : `${h - 12}pm`
}

interface CellInfo {
  day: number
  hour: number
  plays: Array<{ trackId: string; trackName: string; artist: string; playedAt: string }>
}

export function ListeningHeatmap({ tracks }: ListeningHeatmapProps) {
  const [selected, setSelected] = useState<CellInfo | null>(null)
  const { setHeatmapHighlight } = useDashboardStore()

  // Build matrix AND collect per-cell track data
  const { matrix, cellTracks, dateRange } = useMemo(() => {
    const m: number[][] = Array.from({ length: 7 }, () => new Array<number>(24).fill(0))
    // cellTracks[day][hour] = list of plays
    const ct: CellInfo['plays'][][] = Array.from({ length: 7 }, () =>
      Array.from({ length: 24 }, () => []),
    )
    let minDate = Infinity
    let maxDate = -Infinity

    for (const track of tracks) {
      for (const ph of track.playHistory) {
        const d = new Date(ph.played_at)
        const ts = d.getTime()
        if (ts < minDate) minDate = ts
        if (ts > maxDate) maxDate = ts
        const dow = d.getDay()
        const hr = d.getHours()
        m[dow][hr]++
        ct[dow][hr].push({
          trackId: track.track.id,
          trackName: track.track.name,
          artist: track.track.artists[0]?.name ?? '',
          playedAt: d.toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: '2-digit', minute: '2-digit',
          }),
        })
      }
    }

    // Format date range string
    const fmt = (ts: number) =>
      new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
    const dateRange =
      minDate !== Infinity && maxDate !== -Infinity
        ? `${fmt(minDate)} — ${fmt(maxDate)}`
        : ''

    return { matrix: m, cellTracks: ct, dateRange }
  }, [tracks])

  const maxCount = Math.max(...matrix.flat(), 1)

  function cellColor(count: number): string {
    if (count === 0) return '#282828'
    const t = count / maxCount
    // green with alpha
    const alpha = Math.round(30 + t * 225).toString(16).padStart(2, '0')
    return `#1DB954${alpha}`
  }

  const cellW = 18
  const cellH = 14
  const labelW = 28
  const labelH = 16
  const svgW = labelW + 24 * cellW
  const svgH = labelH + 7 * cellH

  function handleCellClick(day: number, hour: number) {
    const plays = cellTracks[day][hour]
    if (plays.length === 0) return
    if (selected?.day === day && selected?.hour === hour) {
      setSelected(null)
      setHeatmapHighlight(null)
    } else {
      setSelected({ day, hour, plays })
      setHeatmapHighlight(new Set(plays.map((p) => p.trackId)))
    }
  }

  return (
    <div>
      {/* Date range header */}
      {dateRange && (
        <p className="text-xs text-spotify-text mb-2">{dateRange}</p>
      )}

      <div className="overflow-x-auto">
        <svg width={svgW} height={svgH} className="cursor-pointer">
          {/* Hour labels every 3h */}
          {HOURS.filter((h) => h % 3 === 0).map((h) => (
            <text key={h} x={labelW + h * cellW + cellW / 2} y={labelH - 3}
              textAnchor="middle" fontSize={7} fill="#B3B3B3">
              {hourLabel(h)}
            </text>
          ))}

          {/* Day labels */}
          {DAYS.map((day, di) => (
            <text key={day} x={labelW - 4} y={labelH + di * cellH + cellH / 2}
              textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#B3B3B3">
              {day}
            </text>
          ))}

          {/* Cells */}
          {DAYS.map((_, di) =>
            HOURS.map((h) => {
              const isSelected = selected?.day === di && selected?.hour === h
              const count = matrix[di][h]
              return (
                <rect
                  key={`${di}-${h}`}
                  x={labelW + h * cellW + 1}
                  y={labelH + di * cellH + 1}
                  width={cellW - 2}
                  height={cellH - 2}
                  rx={2}
                  fill={isSelected ? '#60A5FA' : cellColor(count)}
                  stroke={isSelected ? '#93C5FD' : 'none'}
                  strokeWidth={1}
                  onClick={() => handleCellClick(di, h)}
                  style={{ cursor: count > 0 ? 'pointer' : 'default' }}
                />
              )
            }),
          )}
        </svg>
      </div>

      {/* Click popup */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
            className="mt-3 bg-spotify-card border border-spotify-border rounded-lg p-3"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-white">
                {DAYS[selected.day]} · {hourLabel(selected.hour)} — {selected.plays.length} play{selected.plays.length !== 1 ? 's' : ''}
              </p>
              <button onClick={() => { setSelected(null); setHeatmapHighlight(null) }} className="text-spotify-text hover:text-white text-xs">✕</button>
            </div>
            <ul className="space-y-1.5 max-h-36 overflow-y-auto">
              {selected.plays.map((p, i) => (
                <li key={i} className="text-xs">
                  <span className="text-white font-medium">{p.trackName}</span>
                  <span className="text-spotify-text"> · {p.artist}</span>
                  <div className="text-spotify-text/60 text-[10px]">{p.playedAt}</div>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
