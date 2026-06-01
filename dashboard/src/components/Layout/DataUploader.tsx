import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DataUploaderProps {
  isOpen: boolean
  onClose: () => void
  onTokenSubmit: (token: string) => void
  onJsonUpload: (json: unknown) => void
}

export function DataUploader({ isOpen, onClose, onTokenSubmit, onJsonUpload }: DataUploaderProps) {
  const [tab, setTab] = useState<'token' | 'file'>('token')
  const [token, setToken] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [fileName, setFileName] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)
      const file = e.dataTransfer.files[0]
      if (!file) return
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string)
          onJsonUpload(parsed)
          onClose()
        } catch {
          alert('Invalid JSON file')
        }
      }
      reader.readAsText(file)
    },
    [onJsonUpload, onClose],
  )

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return
      setFileName(file.name)
      const reader = new FileReader()
      reader.onload = (evt) => {
        try {
          const parsed = JSON.parse(evt.target?.result as string)
          onJsonUpload(parsed)
          onClose()
        } catch {
          alert('Invalid JSON file')
        }
      }
      reader.readAsText(file)
    },
    [onJsonUpload, onClose],
  )

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40 w-full max-w-md"
          >
            <div className="bg-spotify-dark rounded-2xl border border-spotify-border shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-spotify-border">
                <h2 className="text-white font-semibold">Connect your data</h2>
                <button onClick={onClose} className="text-spotify-text hover:text-white text-xl leading-none">×</button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-spotify-border">
                {(['token', 'file'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                      tab === t
                        ? 'text-white border-b-2 border-spotify-green'
                        : 'text-spotify-text hover:text-white'
                    }`}
                  >
                    {t === 'token' ? 'Spotify Token' : 'Upload JSON'}
                  </button>
                ))}
              </div>

              <div className="p-5">
                {tab === 'token' ? (
                  <div className="space-y-4">
                    <p className="text-xs text-spotify-text">
                      Paste a Spotify access token from{' '}
                      <code className="bg-spotify-card px-1 rounded">get_spotify_token.py</code>{' '}
                      or the Spotify Web API console. The token is used client-side only.
                    </p>
                    <textarea
                      value={token}
                      onChange={(e) => setToken(e.target.value)}
                      placeholder="BQD..."
                      rows={3}
                      className="w-full bg-spotify-card border border-spotify-border rounded-lg px-3 py-2 text-white text-xs font-mono placeholder-spotify-text focus:outline-none focus:border-spotify-green resize-none"
                    />
                    <button
                      onClick={() => { if (token.trim()) { onTokenSubmit(token.trim()); onClose() } }}
                      disabled={!token.trim()}
                      className="w-full py-2.5 bg-spotify-green text-black font-semibold rounded-full text-sm hover:bg-green-400 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Load live data
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-spotify-text">
                      Drop a JSON export from the Airflow pipeline or{' '}
                      <code className="bg-spotify-card px-1 rounded">EnrichedTrack[]</code> array.
                    </p>
                    <div
                      onDrop={handleDrop}
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                      onDragLeave={() => setDragOver(false)}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                        dragOver
                          ? 'border-spotify-green bg-spotify-green/10'
                          : 'border-spotify-border hover:border-spotify-text'
                      }`}
                    >
                      <p className="text-spotify-text text-sm">
                        {fileName ? `✓ ${fileName}` : 'Drop JSON here or click to browse'}
                      </p>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
