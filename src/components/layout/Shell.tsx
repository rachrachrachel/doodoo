import { type ReactNode, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useBoards } from '@/hooks/useBoard'
import { Avatar } from '@/components/ui/Avatar'
import { BoardIconDisplay } from '@/components/boards/BoardIconPicker'
import { cn } from '@/utils/cn'
import { TodayWidget } from '@/components/profile/TodayWidget'

interface ShellProps {
  children: ReactNode
}

export function Shell({ children }: ShellProps) {
  const { profile, signOut } = useAuth()
  const { boards } = useBoards()
  const location = useLocation()
  const navigate = useNavigate()
  const [boardsOpen, setBoardsOpen] = useState(true)

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Sidebar */}
      <aside className="w-60 flex flex-col p-4 gap-2" style={{ backgroundColor: '#1B1B1B' }}>
        <div className="px-2 py-4">
          <h1 className="font-display text-2xl text-white">DooDoo</h1>
        </div>

        <nav className="flex-1 flex flex-col gap-0.5 overflow-y-auto min-h-0">
          {/* Mis boards link + chevron */}
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={cn(
                'flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-body transition-all duration-hover',
                location.pathname === '/'
                  ? 'bg-accent-yellow text-ink font-medium'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              )}
            >
              <LayoutDashboard size={16} />
              Mis boards
            </Link>
            {boards.length > 0 && (
              <button
                onClick={() => setBoardsOpen((v) => !v)}
                className="p-1.5 rounded-lg text-white/30 hover:text-white/70 transition-colors duration-hover flex-shrink-0"
                aria-label={boardsOpen ? 'Colapsar boards' : 'Expandir boards'}
              >
                {boardsOpen
                  ? <ChevronUp size={13} />
                  : <ChevronDown size={13} />
                }
              </button>
            )}
          </div>

          {/* Board list */}
          {boardsOpen && boards.length > 0 && (
            <div className="ml-2 mt-0.5 flex flex-col gap-0.5">
              {boards.map((board) => {
                const isActive = location.pathname === `/board/${board.id}`
                return (
                  <button
                    key={board.id}
                    onClick={() => navigate(`/board/${board.id}`)}
                    className={cn(
                      'w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm font-body transition-all duration-hover text-left',
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    )}
                  >
                    {board.icon ? (
                      <span className="flex-shrink-0 w-4 h-4 flex items-center justify-center">
                        <BoardIconDisplay iconKey={board.icon} size={16} />
                      </span>
                    ) : (
                      <span
                        className="flex-shrink-0 w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: board.cover_color === '#F5F3EE' ? '#ffffff30' : board.cover_color }}
                      />
                    )}
                    <span className="truncate">{board.title}</span>
                  </button>
                )
              })}
            </div>
          )}
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

