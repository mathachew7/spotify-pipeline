import { useMemo } from 'react'
import { cosineSimilarity, toFeatureVector } from '@/utils/audioFeatures'
import type { EnrichedTrack, ForceEdge } from '@/types/spotify'

// Each node connects to its K most similar peers.
// K=3 gives ~45-55 unique edges for 30 tracks — a clean, readable graph.
const K_NEIGHBOURS = 3

export function useAudioSimilarity(tracks: EnrichedTrack[]): ForceEdge[] {
  return useMemo(() => {
    if (tracks.length < 2) return []

    const vectors = tracks.map((t) => toFeatureVector(t.audioFeatures))
    const edgeMap = new Map<string, ForceEdge>()

    for (let i = 0; i < tracks.length; i++) {
      // Score every other track against i
      const ranked = tracks
        .map((_, j) => ({ j, sim: i !== j ? cosineSimilarity(vectors[i], vectors[j]) : -1 }))
        .sort((a, b) => b.sim - a.sim)
        .slice(0, K_NEIGHBOURS)

      for (const { j, sim } of ranked) {
        // Deduplicate edges — use sorted index pair as key
        const [lo, hi] = i < j ? [i, j] : [j, i]
        const key = `${lo}-${hi}`
        if (!edgeMap.has(key)) {
          edgeMap.set(key, {
            source: tracks[lo].track.id,
            target: tracks[hi].track.id,
            similarity: sim,
          })
        }
      }
    }

    return [...edgeMap.values()]
  }, [tracks])
}
