import { cn } from '@/utils/cn'

interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-11 h-11 text-base',
}

const bgColors = [
  'bg-accent-yellow',
  'bg-accent-lila',
  'bg-accent-rose',
  'bg-emerald-200',
  'bg-sky-200',
]

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase()
}

function getColor(name: string) {
  const index = name.charCodeAt(0) % bgColors.length
  return bgColors[index]
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  return (
    <div
      className={cn(
        'rounded-full overflow-hidden flex items-center justify-center flex-shrink-0',
        sizes[size],
        !src && name && getColor(name),
        className
      )}
    >
      {src ? (
        <img src={src} alt={name ?? ''} className="w-full h-full object-cover" />
      ) : (
        <span className="font-body font-medium text-ink">
          {name ? getInitials(name) : '?'}
        </span>
      )}
    </div>
  )
}

interface AvatarGroupProps {
  users: Array<{ id: string; name?: string | null; avatar_url?: string | null }>
  max?: number
  size?: AvatarProps['size']
}

export function AvatarGroup({ users, max = 3, size = 'sm' }: AvatarGroupProps) {
  const visible = users.slice(0, max)
  const overflow = users.length - max

  return (
    <div className="flex -space-x-2">
      {visible.map((u) => (
        <Avatar
          key={u.id}
          src={u.avatar_url}
          name={u.name}
          size={size}
          className="ring-2 ring-white"
        />
      ))}
      {overflow > 0 && (
        <div
          className={cn(
            'rounded-full bg-ink/10 flex items-center justify-center ring-2 ring-white',
            sizes[size]
          )}
        >
          <span className="text-xs font-body text-ink/60">+{overflow}</span>
        </div>
      )}
    </div>
  )
}
