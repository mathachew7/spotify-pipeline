import { useMemo } from 'react'
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

export function ListeningHeatmap({ tracks }: ListeningHeatmapProps) {
  const matrix = useMemo(() => {
    // 7 rows (days) × 24 cols (hours)
    const m: number[][] = Array.from({ length: 7 }, () => new Array<number>(24).fill(0))
    for (const track of tracks) {
      for (const ph of track.playHistory) {
        const d = new Date(ph.played_at)
        m[d.getDay()][d.getHours()]++
      }
    }
    return m
  }, [tracks])

  const maxCount = Math.max(...matrix.flat(), 1)

  function cellColor(count: number): string {
    const t = count / maxCount
    if (t === 0) return '#282828'
    const alpha = Math.round(0.15 + t * 0.85 * 255).toString(16).padStart(2, '0')
    return `#1DB954${alpha}`
  }

  const cellW = 18
  const cellH = 14
  const labelW = 28
  const labelH = 16
  const svgW = labelW + 24 * cellW
  const svgH = labelH + 7 * cellH

  return (
    <div className="overflow-x-auto">
      <svg width={svgW} height={svgH}>
        {/* Hour labels (every 3 hours) */}
        {HOURS.filter((h) => h % 3 === 0).map((h) => (
          <text
            key={h}
            x={labelW + h * cellW + cellW / 2}
            y={labelH - 3}
            textAnchor="middle"
            fontSize={7}
            fill="#B3B3B3"
          >
            {hourLabel(h)}
          </text>
        ))}

        {/* Day labels */}
        {DAYS.map((day, di) => (
          <text
            key={day}
            x={labelW - 4}
            y={labelH + di * cellH + cellH / 2}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={8}
            fill="#B3B3B3"
          >
            {day}
          </text>
        ))}

        {/* Cells */}
        {DAYS.map((_, di) =>
          HOURS.map((h) => (
            <rect
              key={`${di}-${h}`}
              x={labelW + h * cellW + 1}
              y={labelH + di * cellH + 1}
              width={cellW - 2}
              height={cellH - 2}
              rx={2}
              fill={cellColor(matrix[di][h])}
            >
              <title>{`${DAYS[di]} ${hourLabel(h)}: ${matrix[di][h]} plays`}</title>
            </rect>
          )),
        )}
      </svg>
    </div>
  )
}
