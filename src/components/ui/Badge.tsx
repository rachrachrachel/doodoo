import { cn } from '@/utils/cn'

interface BadgeProps {
  label: string
  color: string
  className?: string
}

export function Badge({ label, color, className }: BadgeProps) {
  return (
    <span
      className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-xs font-body font-medium', className)}
      style={{ backgroundColor: color + '33', color }}
    >
      {label}
    </span>
  )
}
