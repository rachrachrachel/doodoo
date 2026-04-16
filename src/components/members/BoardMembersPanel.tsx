import { useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Trash2, Crown, User as UserIcon } from 'lucide-react'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { useMemberStore } from '@/stores/memberStore'
import { useBoardStore } from '@/stores/boardStore'
import { useAuth } from '@/hooks/useAuth'
import { logMemberAdded, logMemberRemoved } from '@/utils/activityLogger'
import type { BoardWithLists, User } from '@/types'

interface BoardMembersPanelProps {
  board: BoardWithLists
  onClose: () => void
}

export function BoardMembersPanel({ board, onClose }: BoardMembersPanelProps) {
  const { profile } = useAuth()
  const { inviteMember, removeMember } = useMemberStore()
  const { fetchBoard } = useBoardStore()

  const [email, setEmail] = useState('')
  const [isInviting, setIsInviting] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState(false)
  const [removingId, setRemovingId] = useState<string | null>(null)

  const isOwner = profile?.id === board.owner_id

  const handleInvite = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!trimmed) return

    setIsInviting(true)
    setInviteError(null)
    setInviteSuccess(false)

    try {
      await inviteMember(board.id, trimmed)
      if (profile) {
        logMemberAdded(board.id, profile.id, trimmed)
      }
      await fetchBoard(board.id)
      setEmail('')
      setInviteSuccess(true)
      setTimeout(() => setInviteSuccess(false), 2500)
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Error al invitar')
    } finally {
      setIsInviting(false)
    }
  }

  const handleRemove = async (userId: string) => {
    setRemovingId(userId)
    try {
      const memberBeingRemoved = board.members.find((m) => m.id === userId)
      await removeMember(board.id, userId)
      if (profile && memberBeingRemoved) {
        logMemberRemoved(
          board.id,
          profile.id,
          memberBeingRemoved.full_name ?? memberBeingRemoved.email
        )
      }
      await fetchBoard(board.id)
    } catch (err) {
      console.error(err)
    } finally {
      setRemovingId(null)
    }
  }

  const getRoleForMember = (member: User): 'owner' | 'member' => {
    return member.id === board.owner_id ? 'owner' : 'member'
  }

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
            <h2 className="font-display text-lg text-ink">Miembros del board</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors duration-hover"
              aria-label="Cerrar panel"
            >
              <X size={18} />
            </button>
          </div>

          {/* Invite section — only for owner */}
          {isOwner && (
            <div className="px-5 py-4 border-b border-ink/5">
              <p className="font-display text-sm text-ink/60 mb-2">Invitar por email</p>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setInviteError(null)
                    setInviteSuccess(false)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleInvite()
                  }}
                  placeholder="nombre@ejemplo.com"
                  className={cn(
                    'flex-1 bg-cream rounded-xl px-3 py-2 font-body text-sm text-ink',
                    'outline-none border-2 border-transparent',
                    'focus:border-accent-yellow/40 placeholder:text-ink/30',
                    'transition-colors duration-hover'
                  )}
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleInvite}
                  disabled={isInviting || !email.trim()}
                >
                  <UserPlus size={14} />
                  {isInviting ? '...' : 'Invitar'}
                </Button>
              </div>

              <AnimatePresence>
                {inviteError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 font-body text-xs text-red-600"
                  >
                    {inviteError}
                  </motion.p>
                )}
                {inviteSuccess && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mt-2 font-body text-xs text-emerald-600"
                  >
                    Invitacion enviada correctamente
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Members list */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <p className="font-display text-sm text-ink/60 mb-3">
              {board.members.length} {board.members.length === 1 ? 'miembro' : 'miembros'}
            </p>

            {board.members.length === 0 ? (
              <p className="font-body text-sm text-ink/30">Sin miembros todavia.</p>
            ) : (
              <ul className="space-y-2">
                {board.members.map((member) => {
                  const role = getRoleForMember(member)
                  const isCurrentUser = member.id === profile?.id
                  const canRemove = isOwner && !isCurrentUser

                  return (
                    <li
                      key={member.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-card',
                        'bg-cream transition-colors duration-hover',
                        'hover:bg-ink/5'
                      )}
                    >
                      <Avatar
                        src={member.avatar_url}
                        name={member.full_name}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-body text-sm text-ink font-medium truncate">
                          {member.full_name ?? member.email}
                        </p>
                        <p className="font-body text-xs text-ink/40 truncate">
                          {member.email}
                        </p>
                      </div>

                      {/* Role badge */}
                      <div
                        className={cn(
                          'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-body',
                          role === 'owner'
                            ? 'bg-accent-yellow/30 text-ink'
                            : 'bg-accent-lila/30 text-ink'
                        )}
                      >
                        {role === 'owner' ? (
                          <Crown size={10} />
                        ) : (
                          <UserIcon size={10} />
                        )}
                        {role === 'owner' ? 'Owner' : 'Miembro'}
                      </div>

                      {canRemove && (
                        <button
                          onClick={() => handleRemove(member.id)}
                          disabled={removingId === member.id}
                          className={cn(
                            'p-1.5 rounded-xl text-ink/30 hover:text-red-500 hover:bg-red-50',
                            'transition-colors duration-hover disabled:opacity-40'
                          )}
                          aria-label={`Remover a ${member.full_name ?? member.email}`}
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(panelContent, document.body)
}
