import { AnimatePresence, motion } from 'framer-motion'
import type { ForceNode } from '@/types/spotify'

interface GraphNodeProps {
  node: ForceNode
  isSelected: boolean
  isHovered: boolean
  isActive: boolean   // false when another node is selected → dims this node
  isDragging: boolean
  onSelect: (node: ForceNode) => void
  onHover: (id: string | null) => void
  onPointerDown: (nodeId: string, e: React.PointerEvent<SVGGElement>) => void
  onPointerMove: (nodeId: string, e: React.PointerEvent<SVGGElement>) => void
  onPointerUp: (nodeId: string, e: React.PointerEvent<SVGGElement>) => void
  onDoubleClick: (nodeId: string) => void
}

function energyLabel(e: number) {
  if (e < 0.35) return 'Calm'
  if (e < 0.55) return 'Chill'
  if (e < 0.70) return 'Mid'
  if (e < 0.85) return 'Hype'
  return 'Intense'
}

function moodEmoji(energy: number, valence: number) {
  if (valence > 0.7 && energy > 0.7) return '🔥'
  if (valence > 0.7) return '😊'
  if (valence < 0.4 && energy > 0.6) return '😤'
  if (valence < 0.4) return '😔'
  return '😐'
}

export function GraphNode({
  node, isSelected, isHovered, isActive, isDragging,
  onSelect, onHover, onPointerDown, onPointerMove, onPointerUp, onDoubleClick,
}: GraphNodeProps) {
  const { radius, color, pulseSpeed } = node
  const x = node.x ?? 0
  const y = node.y ?? 0
  const track = node.enriched.track
  const af = node.enriched.audioFeatures
  const artist = track.artists[0]?.name ?? ''

  // Decide which side to show the tooltip based on the node's position in
  // the *canvas* (we use the absolute sim coordinate as a proxy).
  const tipOnLeft = x > 420

  return (
    <g
      transform={`translate(${x},${y})`}
      style={{ cursor: isDragging ? 'grabbing' : (isHovered ? 'grab' : 'pointer'), opacity: isActive ? 1 : 0.22, transition: 'opacity 0.25s ease' }}
      onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent.stopImmediatePropagation() }}
      onPointerDown={(e) => onPointerDown(node.id, e)}
      onPointerMove={(e) => onPointerMove(node.id, e)}
      onPointerUp={(e) => onPointerUp(node.id, e)}
      onClick={() => onSelect(node)}
      onDoubleClick={() => onDoubleClick(node.id)}
      onMouseEnter={() => onHover(node.id)}
      onMouseLeave={() => { if (!isDragging) onHover(null) }}
    >
      {/* Outer pulse ring */}
      <motion.circle
        r={radius}
        fill={color}
        fillOpacity={0}
        stroke={color}
        strokeWidth={1.5}
        animate={{ r: [radius + 2, radius + 9, radius + 2], strokeOpacity: [0.45, 0, 0.45] }}
        transition={{ duration: pulseSpeed, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Glow ring on hover / select */}
      {(isSelected || isHovered) && (
        <motion.circle
          r={radius + 6}
          fill="none"
          stroke={isSelected ? '#ffffff' : color}
          strokeWidth={isSelected ? 2.5 : 1.5}
          initial={{ opacity: 0 }}
          animate={{ opacity: isSelected ? 0.95 : 0.6 }}
          transition={{ duration: 0.12 }}
        />
      )}

      {/* Main body */}
      <motion.circle
        r={radius}
        fill={color}
        fillOpacity={isSelected ? 1 : 0.85}
        whileHover={{ scale: 1.1 }}
        transition={{ type: 'spring', stiffness: 380, damping: 22 }}
      />

      {/* ── Hover tooltip — explains what the bubble means ── */}
      <AnimatePresence>
        {isHovered && !isSelected && (
          <motion.foreignObject
            x={tipOnLeft ? -(radius + 210) : radius + 14}
            y={-72}
            width={200}
            height={170}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.88 }}
            transition={{ duration: 0.1 }}
            style={{ pointerEvents: 'none', overflow: 'visible' }}
          >
            <div
              style={{
                background: '#1c1c1c',
                border: '1px solid #3e3e3e',
                borderRadius: 10,
                padding: '10px 13px',
                fontSize: 11,
                color: '#fff',
                boxShadow: '0 10px 32px rgba(0,0,0,0.75)',
                width: 198,
                fontFamily: 'Inter, system-ui, sans-serif',
                lineHeight: 1.45,
              }}
            >
              {/* Track + artist */}
              <div style={{ fontWeight: 700, marginBottom: 2, fontSize: 12 }}>
                {track.name.length > 22 ? `${track.name.slice(0, 20)}…` : track.name}
              </div>
              <div style={{ color: '#888', marginBottom: 10, fontSize: 10 }}>{artist}</div>

              {/* Feature rows */}
              <TRow icon="▶" label="Plays" hint="= bubble size" value={`${node.enriched.playCount}×`} color={color} />
              <TRow icon="⚡" label="Energy" hint="= colour" value={`${Math.round(af.energy * 100)}% · ${energyLabel(af.energy)} ${moodEmoji(af.energy, af.valence)}`} color={color} />
              <TRow icon="💃" label="Danceability" value={`${Math.round(af.danceability * 100)}%`} color="#60A5FA" />
              <TRow icon="✨" label="Vibe" value={`${Math.round(af.valence * 100)}% — ${af.valence > 0.65 ? 'Happy' : af.valence < 0.35 ? 'Dark' : 'Neutral'}`} color="#A78BFA" />
              <TRow icon="🎵" label="Tempo" value={`${Math.round(af.tempo)} BPM`} color="#F59E0B" />
              <TRow icon="🎸" label="Acoustic" value={`${Math.round(af.acousticness * 100)}%`} color="#34D399" />

              <div style={{ color: '#555', marginTop: 9, fontSize: 9.5, borderTop: '1px solid #2a2a2a', paddingTop: 7 }}>
                Drag → pin here · Dbl-click → release · Click → detail
              </div>
            </div>
          </motion.foreignObject>
        )}
      </AnimatePresence>

      {/* Label visible when selected */}
      {isSelected && (
        <g>
          <text y={radius + 15} textAnchor="middle" fontSize={10} fill="#fff" fontWeight={600}
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {track.name.length > 18 ? `${track.name.slice(0, 16)}…` : track.name}
          </text>
          <text y={radius + 27} textAnchor="middle" fontSize={9} fill="#B3B3B3"
            style={{ pointerEvents: 'none', userSelect: 'none' }}>
            {artist}
          </text>
        </g>
      )}
    </g>
  )
}

function TRow({ icon, label, value, hint, color }: {
  icon: string; label: string; value: string; hint?: string; color?: string
}) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
      <span style={{ color: '#999', fontSize: 10.5 }}>
        {icon} {label}
        {hint && <span style={{ color: '#555', fontSize: 9, marginLeft: 3 }}>({hint})</span>}
      </span>
      <span style={{ color: color ?? '#fff', fontWeight: 600, fontSize: 10.5 }}>{value}</span>
    </div>
  )
}
