import { useMemo } from 'react'
import { cosineSimilarity, toFeatureVector } from '@/utils/audioFeatures'
import type { EnrichedTrack, ForceEdge } from '@/types/spotify'

const SIMILARITY_THRESHOLD = 0.75

/**
 * Computes all pairs with cosine similarity > threshold.
 * Returns ForceEdge[] ready to pass into D3 forceLink.
 */
export function useAudioSimilarity(tracks: EnrichedTrack[]): ForceEdge[] {
  return useMemo(() => {
    const edges: ForceEdge[] = []
    const vectors = tracks.map((t) => toFeatureVector(t.audioFeatures))

    for (let i = 0; i < tracks.length; i++) {
      for (let j = i + 1; j < tracks.length; j++) {
        const sim = cosineSimilarity(vectors[i], vectors[j])
        if (sim >= SIMILARITY_THRESHOLD) {
          edges.push({
            source: tracks[i].track.id,
            target: tracks[j].track.id,
            similarity: sim,
          })
        }
      }
    }
    return edges
  }, [tracks])
}
