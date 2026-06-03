import { useMemo, useState, useEffect } from 'react'
import { TopBar } from '@/components/Layout/TopBar'
import { Sidebar } from '@/components/Layout/Sidebar'
import { ForceGraph } from '@/components/ForceGraph/ForceGraph'
import { DataUploader } from '@/components/Layout/DataUploader'
import { useSpotifyData } from '@/hooks/useSpotifyData'
import { useDashboardStore } from '@/store/dashboardStore'
import {
  exchangeCode,
  getStoredAuth,
  isTokenFresh,
  refreshAccessToken,
  clearAuth,
  type SpotifyAuth,
} from '@/utils/spotifyAuth'
import type { TimeRange } from '@/types/spotify'

function cutoffForRange(range: TimeRange): Date | null {
  const now = new Date()
  if (range === '1d')  return new Date(now.getTime() - 1  * 86_400_000)
  if (range === '3d')  return new Date(now.getTime() - 3  * 86_400_000)
  if (range === '7d')  return new Date(now.getTime() - 7  * 86_400_000)
  if (range === '30d') return new Date(now.getTime() - 30 * 86_400_000)
  if (range === '90d') return new Date(now.getTime() - 90 * 86_400_000)
  return null
}

export default function App() {
  const [auth, setAuth] = useState<SpotifyAuth | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [uploaderOpen, setUploaderOpen] = useState(false)

  const dataMode = auth ? 'token' : 'mock'
  const accessToken = auth?.accessToken

  // ── Handle OAuth callback + auto-reconnect on mount ───────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    // Always clean the URL so the code isn't visible / reused
    if (code || error) {
      window.history.replaceState({}, '', window.location.pathname)
    }

    if (code) {
      exchangeCode(code).then((newAuth) => {
        if (newAuth) setAuth(newAuth)
      })
      return
    }

    // No callback — try to restore from localStorage
    const stored = getStoredAuth()
    if (!stored) return

    if (isTokenFresh(stored)) {
      setAuth(stored)
    } else {
      refreshAccessToken(stored).then((refreshed) => {
        if (refreshed) setAuth(refreshed)
        else clearAuth()
      })
    }
  }, [])

  const { filters } = useDashboardStore()
  const { data: allTracks = [], isLoading, error } = useSpotifyData({ mode: dataMode, accessToken })

  const filteredTracks = useMemo(() => {
    const cutoff = cutoffForRange(filters.timeRange)
    return allTracks
      .map((t) => {
        const history = cutoff
          ? t.playHistory.filter((ph) => new Date(ph.played_at) >= cutoff)
          : t.playHistory
        return {
          ...t,
          playHistory: history,
          playCount: history.length,
          lastPlayedAt:
            history.length > 0
              ? new Date(Math.max(...history.map((ph) => new Date(ph.played_at).getTime())))
              : t.lastPlayedAt,
        }
      })
      .filter((t) => {
        const hasPlays = t.playCount > 0
        const energyOk = t.audioFeatures.energy >= filters.energyRange[0] &&
                         t.audioFeatures.energy <= filters.energyRange[1]
        const artistOk = filters.artistFilter === null ||
                         t.track.artists.some((a) => a.name === filters.artistFilter)
        return hasPlays && energyOk && artistOk
      })
  }, [allTracks, filters.timeRange, filters.energyRange, filters.artistFilter])

  return (
    <div className="flex flex-col h-screen bg-spotify-black text-white overflow-hidden">
      <TopBar
        trackCount={allTracks.length}
        filteredCount={filteredTracks.length}
        auth={auth}
        onOpenUploader={() => setUploaderOpen(true)}
      />

      <div className="flex flex-1 min-h-0">
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="absolute top-1/2 -translate-y-1/2 z-10 bg-spotify-card border border-l-0 border-spotify-border rounded-r px-1 py-3 text-spotify-text hover:text-white transition-colors"
          style={{ left: sidebarOpen ? '288px' : '0px' }}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        <Sidebar allTracks={allTracks} filteredTracks={filteredTracks} isOpen={sidebarOpen} />

        <main className="flex-1 relative min-w-0">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-spotify-black/80 z-10">
              <div className="text-spotify-text text-sm animate-pulse">Loading tracks…</div>
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-red-400 text-sm">Error: {error.message}</div>
            </div>
          )}
          {!isLoading && allTracks.length > 0 && (
            <ForceGraph tracks={filteredTracks} />
          )}
        </main>
      </div>

      <DataUploader
        isOpen={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        auth={auth}
        onDisconnect={() => setAuth(null)}
      />
    </div>
  )
}
