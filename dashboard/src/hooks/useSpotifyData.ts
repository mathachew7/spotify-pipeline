import { useQuery } from '@tanstack/react-query'
import type { EnrichedTrack } from '@/types/spotify'
import { MOCK_TRACKS } from '@/utils/mockData'

interface SpotifyDataSource {
  mode: 'mock' | 'token' | 'bigquery'
  accessToken?: string
  bigqueryEndpoint?: string
}

async function fetchRecentlyPlayed(accessToken: string): Promise<EnrichedTrack[]> {
  const headers = { Authorization: `Bearer ${accessToken}` }

  // 1. Fetch recently played (max 50)
  const historyRes = await fetch(
    'https://api.spotify.com/v1/me/player/recently-played?limit=50',
    { headers },
  )
  if (!historyRes.ok) throw new Error(`Spotify API ${historyRes.status}`)
  const historyJson = await historyRes.json() as {
    items: Array<{ track: { id: string }; played_at: string; context: null | { type: string; uri: string } }>
  }

  // 2. Deduplicate track IDs
  const trackIds = [...new Set(historyJson.items.map((i) => i.track.id))]

  // 3. Batch fetch audio features (max 100 per request)
  const featureRes = await fetch(
    `https://api.spotify.com/v1/audio-features?ids=${trackIds.join(',')}`,
    { headers },
  )
  if (!featureRes.ok) throw new Error(`Audio features ${featureRes.status}`)
  const featureJson = await featureRes.json() as { audio_features: Array<Record<string, unknown> | null> }

  // 4. Fetch full track objects for metadata
  const tracksRes = await fetch(
    `https://api.spotify.com/v1/tracks?ids=${trackIds.join(',')}`,
    { headers },
  )
  if (!tracksRes.ok) throw new Error(`Tracks ${tracksRes.status}`)
  const tracksJson = await tracksRes.json() as { tracks: Array<Record<string, unknown>> }

  // 5. Join everything
  return trackIds.flatMap((id, idx) => {
    const features = featureJson.audio_features[idx]
    const trackData = tracksJson.tracks[idx]
    if (!features || !trackData) return []

    const plays = historyJson.items
      .filter((i) => i.track.id === id)
      .map((i) => ({ track: trackData as unknown as EnrichedTrack['track'], played_at: i.played_at, context: i.context }))

    return [{
      track: trackData as unknown as EnrichedTrack['track'],
      audioFeatures: features as unknown as EnrichedTrack['audioFeatures'],
      playHistory: plays as unknown as EnrichedTrack['playHistory'],
      playCount: plays.length,
      lastPlayedAt: new Date(plays[0]?.played_at ?? Date.now()),
    }]
  })
}

export function useSpotifyData(source: SpotifyDataSource = { mode: 'mock' }) {
  return useQuery<EnrichedTrack[], Error>({
    queryKey: ['spotify-data', source.mode, source.accessToken],
    queryFn: async () => {
      if (source.mode === 'mock') return MOCK_TRACKS
      if (source.mode === 'token' && source.accessToken) {
        return fetchRecentlyPlayed(source.accessToken)
      }
      // bigquery mode: call your own backend endpoint
      if (source.mode === 'bigquery' && source.bigqueryEndpoint) {
        const res = await fetch(source.bigqueryEndpoint)
        if (!res.ok) throw new Error(`BigQuery API ${res.status}`)
        return res.json() as Promise<EnrichedTrack[]>
      }
      return MOCK_TRACKS
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  })
}
