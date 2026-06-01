import { useMemo } from 'react'
import type { AudioFeatures } from '@/types/spotify'

interface AudioRadarProps {
  features: AudioFeatures
  size?: number
}

const AXES = [
  { key: 'energy', label: 'Energy' },
  { key: 'danceability', label: 'Dance' },
  { key: 'valence', label: 'Valence' },
  { key: 'acousticness', label: 'Acoustic' },
  { key: 'speechiness', label: 'Speech' },
  { key: 'liveness', label: 'Live' },
] as const

export function AudioRadar({ features, size = 160 }: AudioRadarProps) {
  const cx = size / 2
  const cy = size / 2
  const r = size * 0.36

  const points = useMemo(() => {
    return AXES.map((axis, i) => {
      const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
      const val = features[axis.key] as number
      return {
        x: cx + Math.cos(angle) * r * val,
        y: cy + Math.sin(angle) * r * val,
        lx: cx + Math.cos(angle) * (r + 18),
        ly: cy + Math.sin(angle) * (r + 18),
        label: axis.label,
        val,
      }
    })
  }, [features, cx, cy, r])

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ')

  // Grid rings at 25%, 50%, 75%, 100%
  const rings = [0.25, 0.5, 0.75, 1.0].map((scale) =>
    AXES.map((_, i) => {
      const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
      return `${cx + Math.cos(angle) * r * scale},${cy + Math.sin(angle) * r * scale}`
    }).join(' '),
  )

  // Axis lines
  const axisLines = AXES.map((_, i) => {
    const angle = (Math.PI * 2 * i) / AXES.length - Math.PI / 2
    return { x2: cx + Math.cos(angle) * r, y2: cy + Math.sin(angle) * r }
  })

  return (
    <svg width={size} height={size} className="overflow-visible mx-auto block">
      {/* Grid rings */}
      {rings.map((pts, i) => (
        <polygon key={i} points={pts} fill="none" stroke="#3E3E3E" strokeWidth={0.5} />
      ))}

      {/* Axis lines */}
      {axisLines.map((l, i) => (
        <line key={i} x1={cx} y1={cy} x2={l.x2} y2={l.y2} stroke="#3E3E3E" strokeWidth={0.5} />
      ))}

      {/* Data polygon */}
      <polygon points={polygon} fill="#1DB954" fillOpacity={0.25} stroke="#1DB954" strokeWidth={1.5} />

      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={3} fill="#1DB954" />
      ))}

      {/* Axis labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.lx}
          y={p.ly}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={8}
          fill="#B3B3B3"
        >
          {p.label}
        </text>
      ))}
    </svg>
  )
}
