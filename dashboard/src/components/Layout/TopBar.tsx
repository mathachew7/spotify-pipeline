import { useDashboardStore } from '@/store/dashboardStore'
import type { SpotifyAuth } from '@/utils/spotifyAuth'

interface TopBarProps {
  trackCount: number
  filteredCount: number
  auth: SpotifyAuth | null
  onOpenUploader: () => void
}

export function TopBar({ trackCount, filteredCount, auth, onOpenUploader }: TopBarProps) {
  const { filters, setArtistFilter } = useDashboardStore()
  const activeArtist = filters.artistFilter

  return (
    <header className="h-12 bg-spotify-dark border-b border-spotify-border flex items-center px-4 gap-4 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-spotify-green">
          <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
        <span className="text-white font-semibold text-sm">Wavelength</span>
      </div>

      <div className="h-4 w-px bg-spotify-border" />

      {/* Track count */}
      <div className="flex items-center gap-4 text-xs flex-shrink-0">
        <span className="text-spotify-text">
          {activeArtist ? (
            <>
              <span className="text-white font-medium">{filteredCount}</span>
              <span className="text-spotify-border"> / {trackCount}</span>
              <span> tracks</span>
            </>
          ) : (
            <>
              <span className="text-white font-medium">{trackCount}</span> tracks
            </>
          )}
        </span>
      </div>

      {/* Active artist filter chip */}
      {activeArtist && (
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-spotify-green/20 border border-spotify-green/40 text-xs text-spotify-green font-medium">
            {activeArtist}
            <button
              onClick={() => setArtistFilter(null)}
              className="hover:text-white transition-colors leading-none ml-0.5"
              aria-label="Clear artist filter"
            >
              ✕
            </button>
          </span>
        </div>
      )}

      <div className="flex-1" />

      {/* Connection status / connect button */}
      {auth ? (
        <button
          onClick={onOpenUploader}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-spotify-green/10 border border-spotify-green/30 hover:bg-spotify-green/20 transition-colors flex-shrink-0"
        >
          {auth.avatarUrl ? (
            <img src={auth.avatarUrl} className="w-5 h-5 rounded-full object-cover" />
          ) : (
            <div className="w-5 h-5 rounded-full bg-spotify-green flex items-center justify-center text-black text-[10px] font-bold">
              {auth.displayName[0]?.toUpperCase()}
            </div>
          )}
          <span className="text-spotify-green text-xs font-medium">{auth.displayName}</span>
        </button>
      ) : (
        <button
          onClick={onOpenUploader}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-spotify-green text-black font-semibold rounded-full hover:bg-green-400 transition-colors flex-shrink-0"
        >
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-black">
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
          </svg>
          Connect Spotify
        </button>
      )}
    </header>
  )
}
