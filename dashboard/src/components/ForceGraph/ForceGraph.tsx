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

export function ForceGraph({ tracks }: ForceGraphProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const gRef = useRef<SVGGElement>(null)
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const containerRef = useRef<HTMLDivElement>(null)

  const { selectedTrack, hoveredTrackId, filters, setSelectedTrack, setHoveredTrackId } =
    useDashboardStore()

  // Build ForceNode array from enriched tracks
  const maxPlayCount = Math.max(...tracks.map((t) => t.playCount), 1)
  const forceNodes: ForceNode[] = tracks
    .filter((t) => {
      const e = t.audioFeatures.energy
      return e >= filters.energyRange[0] && e <= filters.energyRange[1]
    })
    .map((t) => ({
      id: t.track.id,
      enriched: t,
      radius: playCountToRadius(t.playCount, maxPlayCount),
      color: energyToColor(t.audioFeatures.energy),
      pulseSpeed: getPulseSpeed(t.lastPlayedAt),
    }))

  const filteredTracks = tracks.filter((t) => {
    const e = t.audioFeatures.energy
    return e >= filters.energyRange[0] && e <= filters.energyRange[1]
  })

  const edges: ForceEdge[] = useAudioSimilarity(filteredTracks)
  const { nodes, edges: simEdges } = useForceSimulation(
    forceNodes, edges, dimensions.width, dimensions.height,
  )

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect
      setDimensions({ width, height })
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // D3 zoom
  useEffect(() => {
    if (!svgRef.current || !gRef.current) return
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.3, 4])
      .on('zoom', (event: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        if (gRef.current) {
          d3.select(gRef.current).attr('transform', event.transform.toString())
        }
      })
    d3.select(svgRef.current).call(zoom)
    zoomRef.current = zoom
  }, [])

  const handleZoomIn = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 1.4)
  }, [])

  const handleZoomOut = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current).transition().duration(250).call(zoomRef.current.scaleBy, 0.7)
  }, [])

  const handleResetZoom = useCallback(() => {
    if (!svgRef.current || !zoomRef.current) return
    d3.select(svgRef.current)
      .transition()
      .duration(350)
      .call(zoomRef.current.transform, d3.zoomIdentity)
  }, [])

  // Edge opacity mapped from similarity 0.75–1.0 → 0.1–0.6
  function edgeOpacity(sim: number): number {
    return 0.1 + ((sim - 0.75) / 0.25) * 0.5
  }

  return (
    <div ref={containerRef} className="relative w-full h-full bg-spotify-black overflow-hidden">
      <GraphControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex items-center gap-4 text-xs text-spotify-text bg-spotify-card/70 backdrop-blur px-3 py-2 rounded-lg border border-spotify-border">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-energy-low inline-block" /> Low energy
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-energy-mid inline-block" /> Mid
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-energy-high inline-block" /> High
        </span>
        <span className="text-spotify-border">|</span>
        <span>Node size = play count</span>
        <span className="text-spotify-border">|</span>
        <span>{nodes.length} tracks · {simEdges.length} edges</span>
      </div>

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        className="w-full h-full"
      >
        <g ref={gRef}>
          {/* Edges */}
          {simEdges.map((edge, i) => {
            const src = edge.source as ForceNode
            const tgt = edge.target as ForceNode
            const srcHovered = hoveredTrackId === src.id || hoveredTrackId === tgt.id
            const opacity = srcHovered ? edgeOpacity(edge.similarity) * 3 : edgeOpacity(edge.similarity)

            return (
              <line
                key={i}
                x1={src.x ?? 0}
                y1={src.y ?? 0}
                x2={tgt.x ?? 0}
                y2={tgt.y ?? 0}
                stroke={srcHovered ? '#ffffff' : '#ffffff'}
                strokeOpacity={opacity}
                strokeWidth={srcHovered ? 1.5 : 0.8}
              />
            )
          })}

          {/* Nodes */}
          {nodes.map((node) => (
            <GraphNode
              key={node.id}
              node={node}
              isSelected={selectedTrack?.track.id === node.id}
              isHovered={hoveredTrackId === node.id}
              onSelect={(n) => setSelectedTrack(n.enriched)}
              onHover={setHoveredTrackId}
            />
          ))}
        </g>
      </svg>

      <TrackDetailPanel />
    </div>
  )
}
