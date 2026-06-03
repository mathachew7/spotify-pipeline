import type * as d3 from 'd3'

export interface AudioFeatures {
  id: string
  danceability: number      // 0–1
  energy: number            // 0–1
  key: number               // 0–11, -1 = no key detected
  loudness: number          // dB, typically -60 to 0
  mode: number              // 0 = minor, 1 = major
  speechiness: number       // 0–1
  acousticness: number      // 0–1
  instrumentalness: number  // 0–1
  liveness: number          // 0–1
  valence: number           // 0–1 (musical positivity)
  tempo: number             // BPM
  duration_ms: number
  time_signature: number    // 3–7
}

export interface Artist {
  id: string
  name: string
  genres: string[]
}

export interface AlbumImage {
  url: string
  height: number
  width: number
}

export interface Album {
  id: string
  name: string
  images: AlbumImage[]
  release_date: string
}

export interface Track {
  id: string
  name: string
  artists: Artist[]
  album: Album
  duration_ms: number
  popularity: number          // 0–100
  preview_url: string | null
  external_urls: { spotify: string }
}

export interface PlayHistory {
  track: Track
  played_at: string           // ISO 8601
  context: { type: string; uri: string } | null
}

export interface EnrichedTrack {
  track: Track
  audioFeatures: AudioFeatures
  playHistory: PlayHistory[]
  playCount: number
  lastPlayedAt: Date
}

// ── D3 force simulation types ──────────────────────────────────────────────

export interface ForceNode extends d3.SimulationNodeDatum {
  id: string
  enriched: EnrichedTrack
  radius: number      // 8–28 px, based on playCount
  color: string       // mapped from energy via gradient
  pulseSpeed: number  // 0.8 | 2 | 4 seconds
}

export interface ForceEdge extends d3.SimulationLinkDatum<ForceNode> {
  similarity: number  // cosine similarity 0.75–1.0
}

// ── Dashboard state types ─────────────────────────────────────────────────

export type TimeRange = '1d' | '3d' | '7d' | '30d' | '90d' | 'all'

export interface DashboardFilters {
  timeRange: TimeRange
  energyRange: [number, number]
  artistFilter: string | null
}

// Audio feature vector used for cosine similarity
export type FeatureVector = [
  number, // danceability
  number, // energy
  number, // valence
  number, // acousticness
  number, // instrumentalness
  number, // speechiness
  number, // liveness
]
