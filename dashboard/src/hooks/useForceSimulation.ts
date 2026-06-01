import { useEffect, useRef, useState, useCallback } from 'react'
import * as d3 from 'd3'
import type { ForceNode, ForceEdge } from '@/types/spotify'

interface SimulationState {
  nodes: ForceNode[]
  edges: ForceEdge[]
}

export function useForceSimulation(
  initialNodes: ForceNode[],
  initialEdges: ForceEdge[],
  width: number,
  height: number,
) {
  const simRef = useRef<d3.Simulation<ForceNode, ForceEdge> | null>(null)
  const [state, setState] = useState<SimulationState>({ nodes: [], edges: [] })

  // Expose a way for drag handlers to fix/release nodes
  const fixNode = useCallback((id: string, x: number, y: number) => {
    const sim = simRef.current
    if (!sim) return
    const node = sim.nodes().find((n) => n.id === id)
    if (node) {
      node.fx = x
      node.fy = y
      sim.alphaTarget(0.3).restart()
    }
  }, [])

  const releaseNode = useCallback((id: string) => {
    const sim = simRef.current
    if (!sim) return
    const node = sim.nodes().find((n) => n.id === id)
    if (node) {
      node.fx = null
      node.fy = null
      sim.alphaTarget(0)
    }
  }, [])

  useEffect(() => {
    if (initialNodes.length === 0) return

    // Deep-clone so D3 can mutate x/y/vx/vy without affecting original props
    const nodes: ForceNode[] = initialNodes.map((n) => ({ ...n }))

    const simulation = d3
      .forceSimulation<ForceNode, ForceEdge>(nodes)
      .force(
        'link',
        d3
          .forceLink<ForceNode, ForceEdge>(initialEdges)
          .id((d) => d.id)
          .distance(80)
          .strength(0.3),
      )
      .force('charge', d3.forceManyBody<ForceNode>().strength(-120))
      .force(
        'collide',
        d3.forceCollide<ForceNode>((d) => d.radius + 6),
      )
      .force('center', d3.forceCenter(width / 2, height / 2))
      .alphaDecay(0.02)

    simulation.on('tick', () => {
      const linkForce = simulation.force<d3.ForceLink<ForceNode, ForceEdge>>('link')
      setState({
        nodes: [...simulation.nodes()],
        edges: linkForce ? ([...linkForce.links()] as ForceEdge[]) : [],
      })
    })

    simRef.current = simulation

    return () => {
      simulation.stop()
    }
    // Only re-create simulation when node/edge count changes or canvas size changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialNodes.length, initialEdges.length, width, height])

  return { nodes: state.nodes, edges: state.edges, fixNode, releaseNode }
}
