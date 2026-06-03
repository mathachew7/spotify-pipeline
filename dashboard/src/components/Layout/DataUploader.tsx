import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  startAuthFlow,
  clearAuth,
  getStoredClientId,
  saveClientId,
  getRedirectUri,
  type SpotifyAuth,
} from '@/utils/spotifyAuth'

interface DataUploaderProps {
  isOpen: boolean
  onClose: () => void
  auth: SpotifyAuth | null
  onDisconnect: () => void
}

export function DataUploader({ isOpen, onClose, auth, onDisconnect }: DataUploaderProps) {
  const [clientId, setClientId] = useState(getStoredClientId)
  const [connecting, setConnecting] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function handleConnect() {
    const id = clientId.trim()
    if (!id) return
    setErr(null)
    setConnecting(true)
    saveClientId(id)
    try {
      await startAuthFlow(id)
      // Page redirects — this line only runs if something went wrong
    } catch {
      setErr('Could not start the auth flow. Check your Client ID.')
      setConnecting(false)
    }
  }

  function handleDisconnect() {
    clearAuth()
    onDisconnect()
    onClose()
  }

  const redirectUri = getRedirectUri()

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-30"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-40 flex items-center justify-center px-4 pointer-events-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
            className="w-full max-w-md pointer-events-auto"
          >
            <div className="bg-[#1a1a1a] rounded-2xl border border-spotify-border shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-spotify-border">
                <div className="flex items-center gap-2.5">
                  <SpotifyLogo />
                  <h2 className="text-white font-semibold text-sm">
                    {auth ? 'Spotify Connected' : 'Connect Spotify'}
                  </h2>
                </div>
                <button onClick={onClose} className="text-spotify-text hover:text-white text-xl leading-none">×</button>
              </div>

              <div className="p-5">
                {auth ? (
                  // ── Connected state ──────────────────────────────────
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-3 bg-spotify-green/10 border border-spotify-green/30 rounded-xl">
                      {auth.avatarUrl
                        ? <img src={auth.avatarUrl} className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-10 h-10 rounded-full bg-spotify-green/30 flex items-center justify-center text-spotify-green font-bold flex-shrink-0">
                            {auth.displayName[0]?.toUpperCase()}
                          </div>
                      }
                      <div>
                        <p className="text-white font-semibold text-sm">{auth.displayName}</p>
                        <p className="text-spotify-green text-xs">● Live Spotify data</p>
                      </div>
                    </div>

                    <p className="text-xs text-spotify-text">
                      Your recently played tracks are loaded. Token refreshes automatically.
                    </p>

                    <button
                      onClick={handleDisconnect}
                      className="w-full py-2.5 rounded-full border border-spotify-border text-spotify-text text-sm font-medium hover:text-white hover:border-white transition-colors"
                    >
                      Disconnect
                    </button>
                  </div>

                ) : (
                  // ── Setup state ──────────────────────────────────────
                  <div className="space-y-5">

                    {/* Steps */}
                    <div className="space-y-3">
                      <Step n={1} title="Create a free Spotify app">
                        Go to{' '}
                        <a
                          href="https://developer.spotify.com/dashboard"
                          target="_blank"
                          rel="noreferrer"
                          className="text-spotify-green underline"
                        >
                          developer.spotify.com/dashboard
                        </a>
                        , click <strong className="text-white">Create app</strong>.
                        Name it anything.
                      </Step>

                      <Step n={2} title="Add the redirect URI">
                        In your app settings → <strong className="text-white">Redirect URIs</strong>, add:
                        <code className="block mt-1.5 bg-spotify-card px-2.5 py-1.5 rounded text-xs text-spotify-green font-mono break-all select-all">
                          {redirectUri}
                        </code>
                      </Step>

                      <Step n={3} title="Paste your Client ID below">
                        Copy it from the app's settings page.
                      </Step>
                    </div>

                    {/* Client ID input */}
                    <div className="space-y-2">
                      <label className="text-xs text-spotify-text">Client ID</label>
                      <input
                        type="text"
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        placeholder="a1b2c3d4e5f6..."
                        className="w-full bg-spotify-card border border-spotify-border rounded-lg px-3 py-2.5 text-white text-sm font-mono placeholder-spotify-text/50 focus:outline-none focus:border-spotify-green transition-colors"
                        onKeyDown={(e) => e.key === 'Enter' && handleConnect()}
                      />
                    </div>

                    {err && <p className="text-red-400 text-xs">{err}</p>}

                    <button
                      onClick={handleConnect}
                      disabled={!clientId.trim() || connecting}
                      className="w-full py-3 bg-spotify-green text-black font-bold rounded-full text-sm hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {connecting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                          Redirecting to Spotify…
                        </>
                      ) : (
                        <>
                          <SpotifyLogo small />
                          Connect with Spotify
                        </>
                      )}
                    </button>

                    <p className="text-xs text-spotify-text/60 text-center">
                      Your token is stored locally and never leaves your browser.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-5 h-5 rounded-full bg-spotify-green/20 border border-spotify-green/40 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-spotify-green text-[10px] font-bold">{n}</span>
      </div>
      <div>
        <p className="text-white text-xs font-semibold mb-0.5">{title}</p>
        <p className="text-spotify-text text-xs leading-relaxed">{children}</p>
      </div>
    </div>
  )
}

function SpotifyLogo({ small }: { small?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={small ? 'w-4 h-4' : 'w-5 h-5'} fill="#1DB954">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
    </svg>
  )
}
