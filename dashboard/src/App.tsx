import { useState } from 'react'
import { TopBar } from '@/components/Layout/TopBar'
import { Sidebar } from '@/components/Layout/Sidebar'
import { ForceGraph } from '@/components/ForceGraph/ForceGraph'
import { DataUploader } from '@/components/Layout/DataUploader'
import { useSpotifyData } from '@/hooks/useSpotifyData'

type DataMode = 'mock' | 'token' | 'bigquery'

export default function App() {
  const [dataMode, setDataMode] = useState<DataMode>('mock')
  const [accessToken, setAccessToken] = useState<string | undefined>()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [uploaderOpen, setUploaderOpen] = useState(false)

  const { data: tracks = [], isLoading, error } = useSpotifyData({
    mode: dataMode,
    accessToken,
  })

  const handleTokenSubmit = (token: string) => {
    setAccessToken(token)
    setDataMode('token')
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleJsonUpload = (_json: unknown) => {
    // TODO: parse and inject into query cache
    console.log('JSON upload — wiring to be done in step 8')
  }

  return (
    <div className="flex flex-col h-screen bg-spotify-black text-white overflow-hidden">
      <TopBar
        trackCount={tracks.length}
        dataMode={dataMode}
        onOpenUploader={() => setUploaderOpen(true)}
      />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar toggle button */}
        <button
          onClick={() => setSidebarOpen((o) => !o)}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-spotify-card border border-l-0 border-spotify-border rounded-r px-1 py-3 text-spotify-text hover:text-white transition-colors"
          style={{ left: sidebarOpen ? '288px' : '0px' }}
        >
          {sidebarOpen ? '‹' : '›'}
        </button>

        <Sidebar tracks={tracks} isOpen={sidebarOpen} />

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
          {!isLoading && tracks.length > 0 && <ForceGraph tracks={tracks} />}
        </main>
      </div>

      <DataUploader
        isOpen={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        onTokenSubmit={handleTokenSubmit}
        onJsonUpload={handleJsonUpload}
      />
    </div>
  )
}
