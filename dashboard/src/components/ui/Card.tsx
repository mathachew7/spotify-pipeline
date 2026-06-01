import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  title?: string
}

export function Card({ children, className = '', title }: CardProps) {
  return (
    <div className={`bg-spotify-card rounded-xl border border-spotify-border ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-spotify-border">
          <h3 className="text-sm font-semibold text-white">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  )
}
