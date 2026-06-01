import { motion } from 'framer-motion'
import type { ForceNode } from '@/types/spotify'

interface GraphNodeProps {
  node: ForceNode
  isSelected: boolean
  isHovered: boolean
  onSelect: (node: ForceNode) => void
  onHover: (id: string | null) => void
}

export function GraphNode({ node, isSelected, isHovered, onSelect, onHover }: GraphNodeProps) {
  const { radius, color, pulseSpeed } = node
  const x = node.x ?? 0
  const y = node.y ?? 0
  const trackName = node.enriched.track.name
  const artistName = node.enriched.track.artists[0]?.name ?? ''

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: 'pointer' }}
      onClick={() => onSelect(node)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => onHover(null)}
    >
      {/* Outer pulse ring — energy-coloured, animates to indicate recency */}
      <motion.circle
        r={radius}
        fill={color}
        fillOpacity={0}
        stroke={color}
        strokeWidth={1.5}
        animate={{
          r: [radius + 2, radius + 8, radius + 2],
          strokeOpacity: [0.4, 0, 0.4],
        }}
        transition={{ duration: pulseSpeed, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Selection / hover glow ring */}
      {(isSelected || isHovered) && (
        <motion.circle
          r={radius + 5}
          fill="none"
          stroke={isSelected ? '#ffffff' : color}
          strokeWidth={isSelected ? 2 : 1.5}
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: isSelected ? 0.9 : 0.55, scale: 1 }}
          transition={{ duration: 0.15 }}
        />
      )}

      {/* Main node body */}
      <motion.circle
        r={radius}
        fill={color}
        fillOpacity={isSelected ? 1 : 0.82}
        whileHover={{ scale: 1.12 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      />

      {/* Track label — only visible on hover/select */}
      {(isHovered || isSelected) && (
        <motion.g
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.1 }}
        >
          <text
            y={radius + 14}
            textAnchor="middle"
            fontSize={10}
            fill="#ffffff"
            fontWeight={600}
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {trackName.length > 18 ? `${trackName.slice(0, 16)}…` : trackName}
          </text>
          <text
            y={radius + 26}
            textAnchor="middle"
            fontSize={9}
            fill="#B3B3B3"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {artistName}
          </text>
        </motion.g>
      )}
    </g>
  )
}
