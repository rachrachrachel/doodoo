import { type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, LogOut } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import { TodayWidget } from '@/components/profile/TodayWidget'

interface ShellProps {
  children: ReactNode
}

export function Shell({ children }: ShellProps) {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col p-4 gap-2" style={{ backgroundColor: '#1B1B1B' }}>
        <div className="px-2 py-4">
          <h1 className="font-display text-2xl text-white">DooDoo</h1>
        </div>

        <nav className="flex-1">
          <NavItem
            to="/"
            icon={<LayoutDashboard size={16} />}
            label="Mis boards"
            active={location.pathname === '/'}
          />
        </nav>

        {/* User */}
        {profile && (
          <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/5 transition-colors duration-hover">
            <Avatar src={profile.avatar_url} name={profile.full_name} size="sm" />
            <span className="font-body text-sm text-white/70 flex-1 truncate">
              {profile.full_name ?? profile.email}
            </span>
            <button
              onClick={() => signOut()}
              className="text-white/30 hover:text-white transition-colors duration-hover"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>

      <TodayWidget />
    </div>
  )
}

function NavItem({
  to,
  icon,
  label,
  active,
}: {
  to: string
  icon: ReactNode
  label: string
  active: boolean
}) {
  return (
    <Link
      to={to}
      className={cn(
        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-body transition-all duration-hover',
        active
          ? 'bg-accent-yellow text-ink font-medium'
          : 'text-white/50 hover:text-white hover:bg-white/5'
      )}
    >
      {icon}
      {label}
    </Link>
  )
}
