import { type ButtonHTMLAttributes } from 'react'
import { cn } from '@/utils/cn'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
}

const variants = {
  primary: 'bg-accent-yellow text-ink font-medium hover:brightness-95',
  secondary: 'bg-surface border border-ink/10 text-ink hover:bg-cream',
  ghost: 'text-ink/60 hover:text-ink hover:bg-ink/5',
  danger: 'bg-red-100 text-red-700 hover:bg-red-200',
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center gap-2 rounded-xl font-body transition-all duration-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-yellow',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}
