import type { AudioFeatures, FeatureVector } from '@/types/spotify'

/**
 * Extract the 7-dimensional feature vector used for similarity.
 * All dimensions are already 0–1 from the Spotify API.
 */
export function toFeatureVector(f: AudioFeatures): FeatureVector {
  return [
    f.danceability,
    f.energy,
    f.valence,
    f.acousticness,
    f.instrumentalness,
    f.speechiness,
    f.liveness,
  ]
}

export function cosineSimilarity(a: FeatureVector, b: FeatureVector): number {
  let dot = 0
  let magA = 0
  let magB = 0
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i]
    magA += a[i] * a[i]
    magB += b[i] * b[i]
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB)
  return denom === 0 ? 0 : dot / denom
}

/** Map energy (0–1) to a hex color through the low→mid→high gradient. */
export function energyToColor(energy: number): string {
  // #1DB954 (green) → #F59E0B (amber) → #EF4444 (red)
  if (energy < 0.4) {
    const t = energy / 0.4
    return interpolateHex('#1DB954', '#F59E0B', t)
  }
  const t = (energy - 0.4) / 0.6
  return interpolateHex('#F59E0B', '#EF4444', t)
}

function interpolateHex(from: string, to: string, t: number): string {
  const f = hexToRgb(from)
  const s = hexToRgb(to)
  const r = Math.round(f[0] + (s[0] - f[0]) * t)
  const g = Math.round(f[1] + (s[1] - f[1]) * t)
  const b = Math.round(f[2] + (s[2] - f[2]) * t)
  return `rgb(${r},${g},${b})`
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ]
}

/** Returns pulse duration in seconds based on how recently a track was played. */
export function getPulseSpeed(lastPlayedAt: Date): number {
  const msSince = Date.now() - lastPlayedAt.getTime()
  if (msSince < 3_600_000) return 0.8     // < 1 hour
  if (msSince < 86_400_000) return 2.0    // < 1 day
  return 4.0
}

/** Scale play count to node radius in px (8–28 range). */
export function playCountToRadius(playCount: number, maxCount: number): number {
  const normalized = maxCount === 0 ? 0 : playCount / maxCount
  return 8 + normalized * 20
}

/** Normalise tempo (60–200 BPM) to 0–1 for display. */
export function normaliseTempo(tempo: number): number {
  return Math.min(1, Math.max(0, (tempo - 60) / 140))
}

/** Normalise loudness (−60 to 0 dB) to 0–1 for display. */
export function normaliseLoudness(loudness: number): number {
  return Math.min(1, Math.max(0, (loudness + 60) / 60))
}
