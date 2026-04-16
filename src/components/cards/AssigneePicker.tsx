import { useState, useRef, useEffect } from 'react'
import { UserPlus, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { useMemberStore } from '@/stores/memberStore'
import { useBoardStore } from '@/stores/boardStore'
import type { User } from '@/types'

interface AssigneePickerProps {
  cardId: string
  boardId: string
  assignees: User[]
  boardMembers: User[]
}

export function AssigneePicker({
  cardId,
  boardId,
  assignees,
  boardMembers,
}: AssigneePickerProps) {
  const [open, setOpen] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { addAssignee, removeAssignee } = useMemberStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const isAssigned = (userId: string) =>
    assignees.some((a) => a.id === userId)

  const handleToggle = async (member: User) => {
    if (loadingId) return
    setLoadingId(member.id)

    try {
      if (isAssigned(member.id)) {
        await removeAssignee(cardId, member.id)
      } else {
        await addAssignee(cardId, member.id)
      }
      await useBoardStore.getState().fetchBoard(boardId)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const hasAssignees = assignees.length > 0

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Current assignees preview */}
      {hasAssignees && (
        <AvatarGroup
          users={assignees.map((u) => ({
            id: u.id,
            name: u.full_name,
            avatar_url: u.avatar_url,
          }))}
          max={6}
          size="md"
        />
      )}

      {/* Picker trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-body text-sm',
            'bg-cream text-ink/60 hover:text-ink hover:bg-ink/5',
            'border-2 border-dashed border-ink/15 hover:border-ink/30',
            'transition-all duration-hover'
          )}
        >
          <UserPlus size={13} />
          {hasAssignees ? 'Editar' : '+ Asignar'}
        </button>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.97 }}
              transition={{ duration: 0.15 }}
              className={cn(
                'absolute left-0 top-full mt-1 z-50',
                'w-60 bg-surface rounded-card shadow-card-hover',
                'border border-ink/5 overflow-hidden'
              )}
            >
              {boardMembers.length === 0 ? (
                <p className="px-3 py-3 font-body text-sm text-ink/40">
                  Sin miembros en el board
                </p>
              ) : (
                <ul className="py-1">
                  {boardMembers.map((member) => {
                    const assigned = isAssigned(member.id)
                    const isLoading = loadingId === member.id

                    return (
                      <li key={member.id}>
                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleToggle(member)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2',
                            'hover:bg-cream transition-colors duration-hover',
                            'disabled:opacity-50',
                            assigned && 'bg-accent-yellow/10'
                          )}
                        >
                          <Avatar
                            src={member.avatar_url}
                            name={member.full_name}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0 text-left">
                            <p className="font-body text-sm text-ink truncate">
                              {member.full_name ?? member.email}
                            </p>
                            <p className="font-body text-xs text-ink/40 truncate">
                              {member.email}
                            </p>
                          </div>
                          {assigned && (
                            <Check
                              size={14}
                              className="flex-shrink-0 text-ink/60"
                            />
                          )}
                          {isLoading && (
                            <div className="w-3.5 h-3.5 border-2 border-ink/30 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!hasAssignees && !open && (
        <p className="font-body text-sm text-ink/30">Sin asignados</p>
      )}
    </div>
  )
}
