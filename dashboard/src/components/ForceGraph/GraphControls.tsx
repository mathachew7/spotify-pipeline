import { useDashboardStore } from '@/store/dashboardStore'
import type { TimeRange } from '@/types/spotify'

const TIME_OPTIONS: { label: string; value: TimeRange }[] = [
  { label: '7d', value: '7d' },
  { label: '30d', value: '30d' },
  { label: '90d', value: '90d' },
  { label: 'All', value: 'all' },
]

interface GraphControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
  onResetZoom: () => void
}

export function GraphControls({ onZoomIn, onZoomOut, onResetZoom }: GraphControlsProps) {
  const { filters, setTimeRange, setEnergyRange } = useDashboardStore()

  return (
    <div className="absolute top-3 left-3 flex flex-col gap-2 z-10">
      {/* Time range */}
      <div className="flex gap-1 bg-spotify-card/80 backdrop-blur rounded-lg p-1 border border-spotify-border">
        {TIME_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setTimeRange(opt.value)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
              filters.timeRange === opt.value
                ? 'bg-spotify-green text-black'
                : 'text-spotify-text hover:text-white'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Energy filter */}
      <div className="bg-spotify-card/80 backdrop-blur rounded-lg p-3 border border-spotify-border min-w-[160px]">
        <p className="text-xs text-spotify-text mb-2">Energy</p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-energy-low font-medium">
            {Math.round(filters.energyRange[0] * 100)}%
          </span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(filters.energyRange[0] * 100)}
            onChange={(e) =>
              setEnergyRange([Number(e.target.value) / 100, filters.energyRange[1]])
            }
            className="flex-1 accent-spotify-green h-1"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(filters.energyRange[1] * 100)}
            onChange={(e) =>
              setEnergyRange([filters.energyRange[0], Number(e.target.value) / 100])
            }
            className="flex-1 accent-energy-high h-1"
          />
          <span className="text-xs text-energy-high font-medium">
            {Math.round(filters.energyRange[1] * 100)}%
          </span>
        </div>
      </div>

      {/* Zoom controls */}
      <div className="flex gap-1 bg-spotify-card/80 backdrop-blur rounded-lg p-1 border border-spotify-border">
        <button
          onClick={onZoomIn}
          className="px-2 py-1 text-xs text-spotify-text hover:text-white transition-colors"
        >
          +
        </button>
        <button
          onClick={onResetZoom}
          className="px-2 py-1 text-xs text-spotify-text hover:text-white transition-colors"
        >
          ⊙
        </button>
        <button
          onClick={onZoomOut}
          className="px-2 py-1 text-xs text-spotify-text hover:text-white transition-colors"
        >
          −
        </button>
      </div>
    </div>
  )
}
