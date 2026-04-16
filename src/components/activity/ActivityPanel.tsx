import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, UserPlus, Move, Plus, Trash2, Activity } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import { useActivityStore, type ActivityLogWithUser } from '@/stores/activityStore'

interface ActivityPanelProps {
  boardId: string
  onClose: () => void
}

const ACTION_LABELS: Record<string, string> = {
  card_created: 'creo la card',
  card_moved: 'movio la card',
  card_deleted: 'elimino una card',
  card_updated: 'actualizo la card',
  member_added: 'agrego un miembro',
  member_removed: 'removio un miembro',
  assignee_added: 'asigno un miembro a la card',
  assignee_removed: 'desasigno un miembro de la card',
  label_added: 'agrego etiqueta a la card',
  label_removed: 'quito etiqueta de la card',
  list_created: 'creo una lista',
  list_deleted: 'elimino una lista',
}

const ACTION_ICONS: Record<string, ReactNode> = {
  card_created: <Plus size={13} />,
  card_moved: <Move size={13} />,
  card_deleted: <Trash2 size={13} />,
  card_updated: <Activity size={13} />,
  member_added: <UserPlus size={13} />,
  member_removed: <Trash2 size={13} />,
  assignee_added: <UserPlus size={13} />,
  assignee_removed: <UserPlus size={13} />,
  label_added: <Plus size={13} />,
  label_removed: <Trash2 size={13} />,
  list_created: <Plus size={13} />,
  list_deleted: <Trash2 size={13} />,
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (seconds < 60) return 'hace un momento'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days === 1) return 'ayer'
  return `hace ${days} dias`
}

function buildDescription(activity: ActivityLogWithUser): string {
  const meta = (activity.metadata ?? {}) as Record<string, string>
  const action = activity.action

  if (action === 'card_moved' && meta.card_title) {
    const parts: string[] = [`movio '${meta.card_title}'`]
    if (meta.from_list && meta.to_list) {
      parts.push(`de '${meta.from_list}' a '${meta.to_list}'`)
    } else if (meta.to_list) {
      parts.push(`a '${meta.to_list}'`)
    }
    return parts.join(' ')
  }

  if (
    (action === 'card_created' || action === 'card_updated' || action === 'card_deleted') &&
    meta.card_title
  ) {
    return `${ACTION_LABELS[action] ?? action} '${meta.card_title}'`
  }

  if ((action === 'member_added' || action === 'member_removed') && meta.member_name) {
    return `${ACTION_LABELS[action] ?? action}: ${meta.member_name}`
  }

  if ((action === 'list_created' || action === 'list_deleted') && meta.list_title) {
    return `${ACTION_LABELS[action] ?? action} '${meta.list_title}'`
  }

  return ACTION_LABELS[action] ?? action
}

function ActivitySkeleton() {
  return (
    <div className="space-y-4 px-5 py-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex gap-3 items-start animate-pulse">
          <div className="w-8 h-8 rounded-full bg-ink/10 flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-ink/10 rounded-full w-3/4" />
            <div className="h-2.5 bg-ink/8 rounded-full w-1/3" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function ActivityPanel({ boardId, onClose }: ActivityPanelProps) {
  const { activities, isLoading, fetchActivities } = useActivityStore()

  useEffect(() => {
    fetchActivities(boardId)
  }, [boardId, fetchActivities])

  const panelContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-end">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-ink/30"
          onClick={onClose}
        />

        {/* Drawer panel */}
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'relative z-10 h-full w-full max-w-sm',
            'bg-surface shadow-card-hover flex flex-col'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-ink/5">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-accent-yellow" />
              <h2 className="font-display text-lg text-ink">Actividad</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors duration-hover"
              aria-label="Cerrar panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <ActivitySkeleton />
            ) : activities.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 px-5 py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center">
                  <Clock size={22} className="text-ink/20" />
                </div>
                <p className="font-body text-sm text-ink/40">
                  Sin actividad reciente
                </p>
              </div>
            ) : (
              <ul className="px-5 py-4 space-y-1">
                {activities.map((activity, index) => {
                  const userName =
                    activity.users?.full_name ?? 'Alguien'
                  const avatarUrl = activity.users?.avatar_url ?? null
                  const description = buildDescription(activity)
                  const icon = ACTION_ICONS[activity.action] ?? (
                    <Activity size={13} />
                  )

                  return (
                    <motion.li
                      key={activity.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03, duration: 0.2 }}
                      className={cn(
                        'flex gap-3 items-start p-3 rounded-card',
                        'hover:bg-cream transition-colors duration-hover'
                      )}
                    >
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <Avatar
                          src={avatarUrl}
                          name={userName}
                          size="sm"
                        />
                        {/* Action badge */}
                        <div
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5',
                            'w-4 h-4 rounded-full flex items-center justify-center',
                            'bg-surface ring-1 ring-ink/10 text-ink/50'
                          )}
                        >
                          {icon}
                        </div>
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-ink leading-snug">
                          <span className="font-medium">{userName}</span>{' '}
                          <span className="text-ink/70">{description}</span>
                        </p>
                        <p className="font-body text-xs text-ink/40 mt-0.5 flex items-center gap-1">
                          <Clock size={10} />
                          {timeAgo(activity.created_at)}
                        </p>
                      </div>
                    </motion.li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer refresh hint */}
          {!isLoading && activities.length > 0 && (
            <div className="px-5 py-3 border-t border-ink/5">
              <button
                onClick={() => fetchActivities(boardId)}
                className="w-full font-body text-xs text-ink/40 hover:text-ink/70 transition-colors duration-hover text-center"
              >
                Actualizar actividad
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(panelContent, document.body)
}
