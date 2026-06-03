import { useRef, useState } from 'react'
import { useDashboardStore } from '@/store/dashboardStore'

export function SearchBar({ matchCount }: { matchCount: number }) {
  const { searchQuery, setSearchQuery } = useDashboardStore()
  const [expanded, setExpanded] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function open() {
    setExpanded(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function close() {
    setExpanded(false)
    setSearchQuery('')
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Escape') close()
  }

  return (
    <div className="flex items-center gap-1 bg-spotify-card/80 backdrop-blur rounded-lg border border-spotify-border px-2 py-1.5 transition-all">
      <button
        onClick={expanded ? close : open}
        className="text-spotify-text hover:text-white transition-colors flex-shrink-0"
        aria-label="Search tracks"
      >
        {expanded
          ? <span className="text-xs leading-none">✕</span>
          : <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <circle cx={11} cy={11} r={8} /><path d="m21 21-4.35-4.35" />
            </svg>
        }
      </button>

      {expanded && (
        <input
          ref={inputRef}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Track or artist…"
          className="bg-transparent text-white text-xs placeholder-spotify-text/50 focus:outline-none w-40"
        />
      )}

      {!expanded && (
        <span className="text-xs text-spotify-text">Search</span>
      )}

      {searchQuery && (
        <span className="text-[10px] text-spotify-green font-medium ml-1 flex-shrink-0">
          {matchCount} match{matchCount !== 1 ? 'es' : ''}
        </span>
      )}
    </div>
  )
}
