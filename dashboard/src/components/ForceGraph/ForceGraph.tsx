import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import * as d3 from 'd3'
import { useForceSimulation } from '@/hooks/useForceSimulation'
import { useAudioSimilarity } from '@/hooks/useAudioSimilarity'
import { useDashboardStore } from '@/store/dashboardStore'
import { energyToColor, getPulseSpeed, playCountToRadius } from '@/utils/audioFeatures'
import { GraphNode } from './GraphNode'
import { GraphControls } from './GraphControls'
import { TrackDetailPanel } from './TrackDetailPanel'
import { SearchBar } from './SearchBar'
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

  const { selectedTrack, hoveredTrackId, heatmapHighlight, searchQuery, setSelectedTrack, setHoveredTrackId } =
    useDashboardStore()

  // Compute search matches
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return null
    const q = searchQuery.toLowerCase()
    return new Set(
      tracks
        .filter((t) =>
          t.track.name.toLowerCase().includes(q) ||
          t.track.artists.some((a) => a.name.toLowerCase().includes(q))
        )
        .map((t) => t.track.id)
    )
  }, [tracks, searchQuery])

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const justDraggedRef = useRef(false)

  const maxPlayCount = Math.max(...tracks.map((t) => t.playCount), 1)
  const forceNodes: ForceNode[] = tracks.map((t) => ({
    id: t.track.id,
    enriched: t,
    radius: playCountToRadius(t.playCount, maxPlayCount),
    color: energyToColor(t.audioFeatures.energy),
    pulseSpeed: getPulseSpeed(t.lastPlayedAt),
  }))

  const edges: ForceEdge[] = useAudioSimilarity(tracks)
  const { nodes, edges: simEdges, fixNode, releaseNode, stopHeating } = useForceSimulation(
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

  // ── Per-node pointer capture drag ─────────────────────────────────────
  // Using pointer events + setPointerCapture so each bubble claims the pointer
  // the moment you press it — D3 zoom never sees the events during a node drag.

  const handleNodePointerDown = useCallback(
    (nodeId: string, e: React.PointerEvent<SVGGElement>) => {
      ;(e.currentTarget as SVGGElement).setPointerCapture(e.pointerId)
      setDraggingNodeId(nodeId)
      dragStateRef.current = { nodeId, startX: e.clientX, startY: e.clientY, hasMoved: false }
      const simNode = nodes.find((n) => n.id === nodeId)
      if (simNode) fixNode(nodeId, simNode.x ?? 0, simNode.y ?? 0)
    },
    [nodes, fixNode],
  )

  const handleNodePointerMove = useCallback(
    (nodeId: string, e: React.PointerEvent<SVGGElement>) => {
      const drag = dragStateRef.current
      if (!drag || drag.nodeId !== nodeId || !svgRef.current) return
      const dx = e.clientX - drag.startX
      const dy = e.clientY - drag.startY
      if (!drag.hasMoved && Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
      drag.hasMoved = true
      const rect = svgRef.current.getBoundingClientRect()
      const transform = d3.zoomTransform(svgRef.current)
      const simX = (e.clientX - rect.left - transform.x) / transform.k
      const simY = (e.clientY - rect.top - transform.y) / transform.k
      fixNode(nodeId, simX, simY)
    },
    [fixNode],
  )

  const handleNodePointerUp = useCallback(
    (nodeId: string, e: React.PointerEvent<SVGGElement>) => {
      const drag = dragStateRef.current
      if (!drag || drag.nodeId !== nodeId) return
      ;(e.currentTarget as SVGGElement).releasePointerCapture(e.pointerId)
      dragStateRef.current = null
      setDraggingNodeId(null)
      if (!drag.hasMoved) {
        releaseNode(nodeId)
      } else {
        justDraggedRef.current = true
        setTimeout(() => { justDraggedRef.current = false }, 50)
        stopHeating()
      }
    },
    [releaseNode, stopHeating],
  )

  // ── Export PNG ────────────────────────────────────────────────────────
  const handleExport = useCallback(() => {
    const svg = svgRef.current
    if (!svg) return
    const { width, height } = svg.getBoundingClientRect()
    const clone = svg.cloneNode(true) as SVGSVGElement
    // Add dark background so PNG isn't transparent
    const bg = document.createElementNS('http://www.w3.org/2000/svg', 'rect')
    bg.setAttribute('width', String(width))
    bg.setAttribute('height', String(height))
    bg.setAttribute('fill', '#121212')
    clone.insertBefore(bg, clone.firstChild)
    const svgStr = new XMLSerializer().serializeToString(clone)
    const canvas = document.createElement('canvas')
    const scale = 2
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')!
    ctx.scale(scale, scale)
    const img = new Image()
    img.onload = () => {
      ctx.drawImage(img, 0, 0)
      canvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'wavelength-graph.png'
        a.click()
        URL.revokeObjectURL(url)
      }, 'image/png')
    }
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgStr)}`
  }, [])

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

  const minSim = simEdges.length > 0 ? Math.min(...simEdges.map((e) => e.similarity)) : 0
  const maxSim = simEdges.length > 0 ? Math.max(...simEdges.map((e) => e.similarity)) : 1
  const simRange = maxSim - minSim || 1

  function edgeStyle(sim: number, lit: boolean): { opacity: number; width: number } {
    const norm = (sim - minSim) / simRange          // 0 → weakest edge, 1 → strongest
    const base = 0.12 + norm * 0.45                 // 0.12–0.57, always visible
    return {
      opacity: lit ? Math.min(base * 3, 0.9) : base,
      width: lit ? 2 : 0.9,
    }
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-spotify-black overflow-hidden">
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onExport={handleExport}
      />

      {/* Floating search — top centre */}
      <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
        <SearchBar matchCount={searchMatches?.size ?? 0} />
      </div>

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
            const isSelected  = selectedTrack?.track.id === node.id
            const isHovered   = hoveredTrackId === node.id
            const inHeatmap   = heatmapHighlight?.has(node.id) ?? false
            const inSearch    = searchMatches?.has(node.id) ?? false
            const isActive    =
              (!selectedTrack && !heatmapHighlight && !searchMatches) ||
              isSelected || isHovered || inHeatmap || inSearch
            return (
              <GraphNode
                key={node.id}
                node={node}
                isSelected={isSelected}
                isHovered={isHovered}
                isActive={isActive}
                isDragging={draggingNodeId === node.id}
                onSelect={(n) => { if (!justDraggedRef.current) setSelectedTrack(n.enriched) }}
                onHover={setHoveredTrackId}
                onPointerDown={handleNodePointerDown}
                onPointerMove={handleNodePointerMove}
                onPointerUp={handleNodePointerUp}
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
