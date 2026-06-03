import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useDashboardStore } from '@/store/dashboardStore'
import { AudioRadar } from '@/components/Charts/AudioRadar'
import { Badge } from '@/components/ui/Badge'
import { energyToColor } from '@/utils/audioFeatures'

export function TrackDetailPanel() {
  const { selectedTrack, setSelectedTrack } = useDashboardStore()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)

  // Stop + reset when track changes
  useEffect(() => {
    setPlaying(false)
    setProgress(0)
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }, [selectedTrack?.track.id])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  return (
    <AnimatePresence>
      {selectedTrack && (
        <motion.aside
          key="detail-panel"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 320, damping: 32 }}
          className="absolute top-0 right-0 h-full w-80 border-l border-spotify-border flex flex-col z-20 overflow-y-auto"
          style={{ backgroundColor: '#222222', boxShadow: '-8px 0 40px rgba(0,0,0,0.85)' }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 border-b border-spotify-border">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-spotify-text uppercase tracking-wider mb-1">Now inspecting</p>
              <h2 className="text-white font-semibold text-sm truncate">
                {selectedTrack.track.name}
              </h2>
              <p className="text-spotify-text text-xs truncate">
                {selectedTrack.track.artists.map((a) => a.name).join(', ')}
              </p>
            </div>
            <button
              onClick={() => setSelectedTrack(null)}
              className="ml-3 mt-1 text-spotify-text hover:text-white transition-colors text-lg leading-none"
              aria-label="Close panel"
            >
              ×
            </button>
          </div>

          {/* Album art + basic stats */}
          <div className="p-4 flex gap-3 items-start border-b border-spotify-border">
            <img
              src={selectedTrack.track.album.images[0]?.url}
              alt={selectedTrack.track.album.name}
              className="w-16 h-16 rounded object-cover flex-shrink-0"
            />
            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-xs text-spotify-text truncate">{selectedTrack.track.album.name}</p>
              <div className="flex flex-wrap gap-1">
                {selectedTrack.track.artists[0]?.genres.slice(0, 3).map((g) => (
                  <Badge key={g} label={g} color="#1DB954" />
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-spotify-text">
                <span>▶ {selectedTrack.playCount}×</span>
                <span>♥ {selectedTrack.track.popularity}</span>
              </div>
            </div>
          </div>

          {/* 30-second preview player */}
          {selectedTrack.track.preview_url ? (
            <div className="px-4 py-3 border-b border-spotify-border">
              <audio
                ref={audioRef}
                src={selectedTrack.track.preview_url}
                onTimeUpdate={() => {
                  const a = audioRef.current
                  if (a && a.duration) setProgress(a.currentTime / a.duration)
                }}
                onEnded={() => { setPlaying(false); setProgress(0) }}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={togglePlay}
                  className="w-8 h-8 rounded-full bg-spotify-green flex items-center justify-center flex-shrink-0 hover:bg-green-400 transition-colors"
                >
                  {playing
                    ? <span className="text-black text-[10px] font-bold">❚❚</span>
                    : <span className="text-black text-xs ml-0.5">▶</span>
                  }
                </button>
                <div className="flex-1 space-y-1">
                  <div className="h-1 bg-spotify-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-spotify-green rounded-full transition-all duration-100"
                      style={{ width: `${progress * 100}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-spotify-text">30s preview</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="px-4 py-2.5 border-b border-spotify-border">
              <p className="text-[10px] text-spotify-text/50 italic">
                No preview available — connect Spotify for audio
              </p>
            </div>
          )}

          {/* Audio feature bars */}
          <div className="p-4 border-b border-spotify-border">
            <p className="text-xs text-spotify-text uppercase tracking-wider mb-3">Audio Features</p>
            <FeatureBar label="Energy" value={selectedTrack.audioFeatures.energy} color={energyToColor(selectedTrack.audioFeatures.energy)} />
            <FeatureBar label="Danceability" value={selectedTrack.audioFeatures.danceability} color="#1DB954" />
            <FeatureBar label="Valence" value={selectedTrack.audioFeatures.valence} color="#60A5FA" />
            <FeatureBar label="Acousticness" value={selectedTrack.audioFeatures.acousticness} color="#A78BFA" />
            <FeatureBar label="Speechiness" value={selectedTrack.audioFeatures.speechiness} color="#F59E0B" />
            <FeatureBar label="Liveness" value={selectedTrack.audioFeatures.liveness} color="#EC4899" />
            <div className="flex justify-between text-xs text-spotify-text mt-3">
              <span>Tempo: <strong className="text-white">{Math.round(selectedTrack.audioFeatures.tempo)} BPM</strong></span>
              <span>Key: <strong className="text-white">{KEY_NAMES[selectedTrack.audioFeatures.key] ?? '?'} {selectedTrack.audioFeatures.mode ? 'maj' : 'min'}</strong></span>
            </div>
          </div>

          {/* Radar chart */}
          <div className="p-4 border-b border-spotify-border">
            <p className="text-xs text-spotify-text uppercase tracking-wider mb-2">Radar</p>
            <AudioRadar features={selectedTrack.audioFeatures} />
          </div>

          {/* Play history */}
          <div className="p-4">
            <p className="text-xs text-spotify-text uppercase tracking-wider mb-3">
              Recent Plays ({selectedTrack.playCount})
            </p>
            <ul className="space-y-1.5">
              {selectedTrack.playHistory.slice(0, 8).map((ph, i) => (
                <li key={i} className="text-xs text-spotify-text">
                  {new Date(ph.played_at).toLocaleString(undefined, {
                    month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </li>
              ))}
            </ul>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function FeatureBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5">
        <span className="text-spotify-text">{label}</span>
        <span className="text-white">{Math.round(value * 100)}</span>
      </div>
      <div className="h-1.5 bg-spotify-border rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${value * 100}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

const KEY_NAMES = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B']
