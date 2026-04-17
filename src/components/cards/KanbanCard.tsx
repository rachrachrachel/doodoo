import { motion } from 'framer-motion'
import { Calendar, Paperclip } from 'lucide-react'
import { cn } from '@/utils/cn'
import { ProgressBar } from '@/components/ui/Card'
import { AvatarGroup } from '@/components/ui/Avatar'
import type { CardWithRelations } from '@/types'

interface KanbanCardProps {
  card: CardWithRelations
  onClick: () => void
}

function formatDueDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = date.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))

  if (days < 0) return 'Vencida'
  if (days === 0) return 'Hoy'
  if (days === 1) return 'Manana'

  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

function isDueDateOverdue(dateStr: string): boolean {
  return new Date(dateStr).getTime() < Date.now()
}

export function KanbanCard({ card, onClick }: KanbanCardProps) {
  const hasLabels = card.labels && card.labels.length > 0
  const hasChecklist = card.checklist_items && card.checklist_items.length > 0
  const hasAssignees = card.assignees && card.assignees.length > 0
  const hasDueDate = !!card.due_date
  const hasAttachments = card.attachments && card.attachments.length > 0

  const checklistCompleted = hasChecklist
    ? card.checklist_items.filter((item) => item.completed).length
    : 0
  const checklistTotal = hasChecklist ? card.checklist_items.length : 0

  const visibleLabels = hasLabels ? card.labels.slice(0, 3) : []
  const overflowLabels = hasLabels ? card.labels.length - 3 : 0

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onClick}
      className={cn(
        'bg-cream rounded-xl p-3 shadow-card cursor-pointer',
        'hover:shadow-card-hover transition-shadow duration-card'
      )}
    >
      {/* Label dots */}
      {hasLabels && (
        <div className="flex items-center gap-1.5 mb-2">
          {visibleLabels.map((label) => (
            <span
              key={label.id}
              className="inline-block h-1.5 w-6 rounded-full"
              style={{ backgroundColor: label.color }}
            />
          ))}
          {overflowLabels > 0 && (
            <span className="font-body text-[10px] text-ink/30">
              +{overflowLabels}
            </span>
          )}
        </div>
      )}

      {/* Title */}
      <p className="font-body text-sm text-ink line-clamp-2">{card.title}</p>

      {/* Progress bar */}
      {hasChecklist && (
        <div className="mt-2">
          <ProgressBar completed={checklistCompleted} total={checklistTotal} />
        </div>
      )}

      {/* Footer: due date + attachments | assignees */}
      {(hasDueDate || hasAttachments || hasAssignees) && (
        <div className="mt-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {hasDueDate && (
              <span
                className={cn(
                  'flex items-center gap-1 flex-shrink-0',
                  isDueDateOverdue(card.due_date!) ? 'text-red-500' : 'text-ink/40'
                )}
              >
                <Calendar size={11} />
                <span className="font-body text-[11px]">{formatDueDate(card.due_date!)}</span>
              </span>
            )}
            {hasAttachments && (
              <span className="flex items-center gap-1 text-ink/35 flex-shrink-0">
                <Paperclip size={11} />
                <span className="font-body text-[11px]">{card.attachments!.length}</span>
              </span>
            )}
          </div>
          {hasAssignees && (
            <AvatarGroup
              users={card.assignees.map((u) => ({
                id: u.id,
                name: u.full_name,
                avatar_url: u.avatar_url,
              }))}
              max={3}
              size="sm"
            />
          )}
        </div>
      )}
    </motion.div>
  )
}
