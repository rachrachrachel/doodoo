import { type ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface CardProps {
  children: ReactNode
  className?: string
  onClick?: () => void
  color?: string
}

export function Card({ children, className, onClick, color }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-surface rounded-card shadow-card p-4',
        'transition-shadow duration-card',
        onClick && 'cursor-pointer hover:shadow-card-hover',
        className
      )}
      style={color ? { backgroundColor: color } : undefined}
    >
      {children}
    </div>
  )
}

interface ProgressBarProps {
  completed: number
  total: number
}

export function ProgressBar({ completed, total }: ProgressBarProps) {
  const pct = total === 0 ? 0 : Math.round((completed / total) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-ink/50 font-body">
        <span>{completed}/{total}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-ink/10 rounded-full overflow-hidden">
        <div
          className="h-full bg-accent-yellow rounded-full transition-all duration-card"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
