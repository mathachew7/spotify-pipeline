import { useRef, useEffect, useCallback, useState } from 'react'
import * as d3 from 'd3'
import { useForceSimulation } from '@/hooks/useForceSimulation'
import { useAudioSimilarity } from '@/hooks/useAudioSimilarity'
import { useDashboardStore } from '@/store/dashboardStore'
import { energyToColor, getPulseSpeed, playCountToRadius } from '@/utils/audioFeatures'
import { GraphNode } from './GraphNode'
import { GraphControls } from './GraphControls'
import { TrackDetailPanel } from './TrackDetailPanel'
import type { EnrichedTrack, ForceNode, ForceEdge } from '@/types/spotify'

interface ForceGraphProps {
  tracks: EnrichedTrack[]
}

// How much the mouse must move before we treat it as a drag (not a click)
const DRAG_THRESHOLD_PX = 6

export function ForceGraph({ tracks }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const dragStateRef = useRef<{
    nodeId: string
    startX: number
    startY: number
    hasMoved: boolean
  } | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  const { selectedTrack, hoveredTrackId, setSelectedTrack, setHoveredTrackId } =
    useDashboardStore()

  const maxPlayCount = Math.max(...tracks.map((t) => t.playCount), 1)
  const forceNodes: ForceNode[] = tracks.map((t) => ({
    id: t.track.id,
    enriched: t,
    radius: playCountToRadius(t.playCount, maxPlayCount),
    color: energyToColor(t.audioFeatures.energy),
    pulseSpeed: getPulseSpeed(t.lastPlayedAt),
  }))

  const edges: ForceEdge[] = useAudioSimilarity(tracks)
  const { nodes, edges: simEdges, fixNode, releaseNode } = useForceSimulation(
    forceNodes, edges, dimensions.width, dimensions.height,
  )

  // ── Resize observer ───────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // ── D3 zoom ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.15, 6])
      .filter((event) => {
        // Block pan/zoom while dragging a node
        if (dragStateRef.current) return false
        return !event.ctrlKey && event.button === 0 || event.type === 'wheel'
      })
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        if (gRef.current) {
          d3.select(gRef.current).attr('transform', event.transform.toString())
        }
      })
    d3.select(svgRef.current).call(zoom)
    zoomRef.current = zoom
  }, [])

  // ── Node drag: mousedown starts tracking ──────────────────────────────
  const handleNodeDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.stopPropagation()
      e.nativeEvent.stopImmediatePropagation()  // prevent D3 zoom from panning
      dragStateRef.current = {
        nodeId,
        startX: e.clientX,
        startY: e.clientY,
        hasMoved: false,
      }
      // Pre-fix so node doesn't jump when we start moving
      const simNode = nodes.find((n) => n.id === nodeId)
      if (simNode) fixNode(nodeId, simNode.x ?? 0, simNode.y ?? 0)
    },
    [nodes, fixNode],
  )

  // ── Node drag: mousemove updates pinned position ──────────────────────
  const handleSvgMouseMove = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      const drag = dragStateRef.current
      if (!drag || !svgRef.current) return

      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (!drag.hasMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return

      drag.hasMoved = true
      const rect = svgRef.current.getBoundingClientRect()
      const transform = d3.zoomTransform(svgRef.current)
      // Convert screen → simulation space
      const simX = (e.clientX - rect.left - transform.x) / transform.k
      const simY = (e.clientY - rect.top - transform.y) / transform.k
      fixNode(drag.nodeId, simX, simY)
    },
    [fixNode],
  )

  // ── Node drag: mouseup ────────────────────────────────────────────────
  // If the user actually dragged → keep node PINNED at drop position (reshape!)
  // If it was just a quick click → release so physics takes over again
  const handleSvgMouseUp = useCallback(() => {
    const drag = dragStateRef.current
    if (!drag) return
    if (!drag.hasMoved) {
      // Plain click — release the pin so node stays in physics
      releaseNode(drag.nodeId)
    }
    // If hasMoved → node stays pinned exactly where user dropped it
    dragStateRef.current = null
  }, [releaseNode])

  // ── Zoom controls ─────────────────────────────────────────────────────
  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(220).call(zoomRef.current.scaleBy, 1.4)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(220).call(zoomRef.current.scaleBy, 0.7)
  }, [])

  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomRef.current.transform, d3.zoomIdentity)
  }, [])

  // Edge colour — linear gradient between node colours would be ideal;
  // using a soft teal so edges read clearly against the dark background
  function edgeStyle(sim: number, lit: boolean): { opacity: number; width: number } {
    // similarity 0.75–1.0 → opacity 0.18–0.55 (visible but not noisy)
    const base = 0.18 + ((sim - 0.75) / 0.25) * 0.37
    return {
      opacity: lit ? Math.min(base * 4, 0.9) : base,
      width: lit ? 2 : 0.9,
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-spotify-black overflow-hidden">
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-3 text-xs text-spotify-text bg-spotify-card/80 backdrop-blur px-3 py-2 rounded-lg border border-spotify-border">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-energy-low inline-block" /> Calm
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-energy-mid inline-block" /> Mid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-energy-high inline-block" /> Intense
        </span>
        <span className="text-spotify-border">·</span>
        <span>Size = plays</span>
        <span className="text-spotify-border">·</span>
        <span>Drag bubble to pin · Double-click to unpin</span>
        <span className="text-spotify-border">·</span>
        <span className="text-spotify-green">{nodes.length} tracks</span>
        <span className="text-spotify-border">·</span>
        <span>{simEdges.length} links</span>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
        onMouseLeave={handleSvgMouseUp}
      >
        {/* SVG defs: subtle gradient for edges */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g ref={gRef}>
          {/* ── Edges ── */}
          {simEdges.map((edge, i) => {
            const src = edge.source as ForceNode
            const tgt = edge.target as ForceNode
            const lit = hoveredTrackId === src.id || hoveredTrackId === tgt.id
            const { opacity, width } = edgeStyle(edge.similarity, lit)

            // Blend edge colour between the two node colours
            const stroke = lit
              ? '#a0f0c0'   // bright mint when highlighted
              : '#7dd3a8'   // soft teal at rest — readable on black

            return (
              <line
                key={i}
                x1={src.x ?? 0}
                y1={src.y ?? 0}
                x2={tgt.x ?? 0}
                y2={tgt.y ?? 0}
                stroke={stroke}
                strokeOpacity={opacity}
                strokeWidth={width}
              />
            )
          })}

          {/* ── Nodes ── */}
          {nodes.map((node) => {
            const isSelected = selectedTrack?.track.id === node.id
            const isHovered  = hoveredTrackId === node.id
            // Dim all nodes when something is selected, except the selection itself and hovered
            const isActive   = !selectedTrack || isSelected || isHovered
            return (
              <GraphNode
                key={node.id}
                node={node}
                isSelected={isSelected}
                isHovered={isHovered}
                isActive={isActive}
                onSelect={(n) => setSelectedTrack(n.enriched)}
                onHover={setHoveredTrackId}
                onDragStart={handleNodeDragStart}
                onDoubleClick={(nodeId) => releaseNode(nodeId)}
              />
            )
          })}
        </g>
      </svg>

      <TrackDetailPanel />
    </div>
  )
}
