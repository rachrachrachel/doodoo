import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { CardModal } from '@/components/cards/CardModal'
import type { CardWithRelations } from '@/types'
import { Users, Activity } from 'lucide-react'
import { useBoard } from '@/hooks/useBoard'
import { useBoardStore } from '@/stores/boardStore'
import { useFilteredBoard } from '@/hooks/useFilteredBoard'
import { KanbanBoard } from '@/components/dnd/KanbanBoard'
import { BoardMembersPanel } from '@/components/members/BoardMembersPanel'
import { ActivityPanel } from '@/components/activity/ActivityPanel'
import { FilterBar } from '@/components/filters/FilterBar'
import { AvatarGroup } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { BoardIconPicker } from '@/components/boards/BoardIconPicker'

export function BoardPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const { board, isLoading } = useBoard(boardId ?? '')
  const { updateBoard } = useBoardStore()
  const filteredBoard = useFilteredBoard(board)
  const [deepLinkCard, setDeepLinkCard] = useState<CardWithRelations | null>(null)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState('')
  const [isEditingDesc, setIsEditingDesc] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false)
  const [isActivityPanelOpen, setIsActivityPanelOpen] = useState(false)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const descInputRef = useRef<HTMLInputElement>(null)

  // Sync drafts only on initial load (not on every board change to avoid resetting mid-edit)
  useEffect(() => {
    if (board && !isEditingTitle) setTitleDraft(board.title)
  }, [board?.title])

  useEffect(() => {
    if (board && !isEditingDesc) setDescDraft(board.description ?? '')
  }, [board?.description])

  // Abrir card desde ?card=<id> (deep link desde widget)
  useEffect(() => {
    const cardId = searchParams.get('card')
    if (!cardId || !board) return
    const card = board.lists.flatMap((l) => l.cards).find((c) => c.id === cardId)
    if (card) {
      setDeepLinkCard(card)
      setSearchParams({}, { replace: true })
    }
  }, [board, searchParams])

  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  useEffect(() => {
    if (isEditingDesc && descInputRef.current) {
      descInputRef.current.focus()
      descInputRef.current.select()
    }
  }, [isEditingDesc])

  const handleTitleSave = async () => {
    const trimmed = titleDraft.trim()
    if (trimmed && trimmed !== board?.title && boardId) {
      await updateBoard(boardId, { title: trimmed })
    } else {
      setTitleDraft(board?.title ?? '')
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleSave()
    if (e.key === 'Escape') {
      setTitleDraft(board?.title ?? '')
      setIsEditingTitle(false)
    }
  }

  const handleDescSave = async () => {
    const trimmed = descDraft.trim()
    if (trimmed !== (board?.description ?? '') && boardId) {
      await updateBoard(boardId, { description: trimmed || null })
    } else {
      setDescDraft(board?.description ?? '')
    }
    setIsEditingDesc(false)
  }

  const handleDescKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleDescSave()
    if (e.key === 'Escape') {
      setDescDraft(board?.description ?? '')
      setIsEditingDesc(false)
    }
  }

  if (isLoading && !board) {
    return (
      <div className="p-8 flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-accent-yellow border-t-transparent rounded-full animate-spin" />
        <span className="text-ink/40 font-body">Cargando board...</span>
      </div>
    )
  }

  if (!board) {
    return (
      <div className="p-8 text-ink/40 font-body">Board no encontrado.</div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Board header */}
      <div className="px-6 pt-6 pb-4 flex-shrink-0">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <BoardIconPicker
                icon={board.icon ?? null}
                onChange={(icon) => boardId && updateBoard(boardId, { icon })}
              />
              {isEditingTitle ? (
                <input
                  ref={titleInputRef}
                  value={titleDraft}
                  onChange={(e) => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="font-display text-3xl text-ink bg-transparent outline-none border-b-2 border-accent-yellow/60 w-full max-w-md"
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="font-display text-3xl text-ink cursor-pointer hover:text-ink/80 transition-colors duration-hover"
                >
                  {board.title}
                </h2>
              )}
            </div>

            {isEditingDesc ? (
              <input
                ref={descInputRef}
                value={descDraft}
                onChange={(e) => setDescDraft(e.target.value)}
                onBlur={handleDescSave}
                onKeyDown={handleDescKeyDown}
                placeholder="Agregar descripcion..."
                className="font-body text-sm text-ink/60 bg-transparent outline-none border-b border-ink/10 focus:border-accent-yellow/40 w-full max-w-lg mt-1 transition-colors duration-hover"
              />
            ) : (
              <p
                onClick={() => setIsEditingDesc(true)}
                className="font-body text-sm text-ink/40 mt-1 cursor-pointer hover:text-ink/60 transition-colors duration-hover"
              >
                {board.description || 'Agregar descripcion...'}
              </p>
            )}
          </div>

          {/* Members preview + action buttons */}
          <div className="flex items-center gap-3 flex-shrink-0 mt-1">
            {board.members && board.members.length > 0 && (
              <AvatarGroup
                users={board.members.slice(0, 3).map((m) => ({
                  id: m.id,
                  name: m.full_name,
                  avatar_url: m.avatar_url,
                }))}
                max={3}
                size="sm"
              />
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsMembersPanelOpen(true)}
            >
              <Users size={14} />
              Miembros
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsActivityPanelOpen(true)}
            >
              <Activity size={14} />
              Actividad
            </Button>

            {/* Live indicator */}
            <div className="flex items-center gap-1.5" title="Sincronización en tiempo real activa">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="font-body text-xs text-ink/40">En vivo</span>
            </div>
          </div>
        </div>

        {/* Filter bar */}
        <FilterBar board={board} />
      </div>

      {isMembersPanelOpen && (
        <BoardMembersPanel
          board={board}
          onClose={() => setIsMembersPanelOpen(false)}
        />
      )}

      {isActivityPanelOpen && boardId && (
        <ActivityPanel
          boardId={boardId}
          onClose={() => setIsActivityPanelOpen(false)}
        />
      )}

      {/* Kanban board with DnD */}
      <KanbanBoard board={filteredBoard ?? board} />

      {/* Modal abierto desde deep link (widget) */}
      {deepLinkCard && boardId && (
        <CardModal
          card={deepLinkCard}
          boardId={boardId}
          onClose={() => setDeepLinkCard(null)}
        />
      )}
    </div>
  )
}
