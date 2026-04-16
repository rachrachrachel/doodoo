import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Trash2,
  Palette,
  Smile,
  X,
} from 'lucide-react'

const EMOJIS = [
  '🚀', '⭐', '🔥', '💡', '🎯', '📌', '✅', '⚡',
  '🎨', '🛠️', '📦', '🐛', '💬', '🔍', '📝', '🎉',
  '❤️', '🟡', '🟣', '🔵', '🟢', '🟠', '⚪', '⚫',
]

// Extrae el emoji del inicio del título si existe
function splitEmoji(title: string): { emoji: string; text: string } {
  const match = title.match(/^(\p{Extended_Pictographic})\s*/u)
  if (match) return { emoji: match[1], text: title.slice(match[0].length) }
  return { emoji: '', text: title }
}
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { cn } from '@/utils/cn'
import { useListStore } from '@/stores/listStore'
import { useCardStore } from '@/stores/cardStore'
import { useBoardStore } from '@/stores/boardStore'
import { useUIStore } from '@/stores/uiStore'
import { useAuth } from '@/hooks/useAuth'
import { logCardCreated, logListDeleted } from '@/utils/activityLogger'
import { SortableCard } from '@/components/dnd/SortableCard'
import { CardModal } from '@/components/cards/CardModal'
import type { ListWithCards, CardWithRelations } from '@/types'

const COLOR_PALETTE = [
  '#F2E840',
  '#D4B8F0',
  '#F0B8D0',
  '#A8D8B9',
  '#A8C8F0',
  '#F0D8A8',
  '#F5F3EE',
]

interface KanbanColumnProps {
  list: ListWithCards
  boardId: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dragHandleProps?: Record<string, any>
}

export function KanbanColumn({ list, boardId, dragHandleProps }: KanbanColumnProps) {
  const { updateList, deleteList } = useListStore()
  const { createCard } = useCardStore()
  const { collapsedLists, toggleListCollapse } = useUIStore()
  const { profile } = useAuth()

  const isCollapsed = collapsedLists.has(list.id)

  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(() => splitEmoji(list.title).text)
  const [emojiDraft, setEmojiDraft] = useState(() => splitEmoji(list.title).emoji)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [newCardTitle, setNewCardTitle] = useState('')
  const [selectedCard, setSelectedCard] = useState<CardWithRelations | null>(null)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const cardInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Focus title input when editing
  useEffect(() => {
    if (isEditingTitle && titleInputRef.current) {
      titleInputRef.current.focus()
      titleInputRef.current.select()
    }
  }, [isEditingTitle])

  // Focus card input when adding
  useEffect(() => {
    if (isAddingCard && cardInputRef.current) {
      cardInputRef.current.focus()
    }
  }, [isAddingCard])

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
        setShowColorPicker(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showMenu])

  const handleTitleSave = async () => {
    const trimmed = titleDraft.trim()
    if (!trimmed) {
      const { emoji, text } = splitEmoji(list.title)
      setTitleDraft(text)
      setEmojiDraft(emoji)
      setIsEditingTitle(false)
      setShowEmojiPicker(false)
      return
    }
    const fullTitle = emojiDraft ? `${emojiDraft} ${trimmed}` : trimmed
    if (fullTitle !== list.title) {
      await updateList(list.id, boardId, { title: fullTitle })
    }
    setIsEditingTitle(false)
    setShowEmojiPicker(false)
  }

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleSave()
    if (e.key === 'Escape') {
      const { emoji, text } = splitEmoji(list.title)
      setTitleDraft(text)
      setEmojiDraft(emoji)
      setIsEditingTitle(false)
      setShowEmojiPicker(false)
    }
  }

  const handleStartEditTitle = () => {
    const { emoji, text } = splitEmoji(list.title)
    setTitleDraft(text)
    setEmojiDraft(emoji)
    setIsEditingTitle(true)
  }

  const handleDeleteList = async () => {
    setShowMenu(false)
    if (profile) {
      logListDeleted(boardId, profile.id, list.title)
    }
    await deleteList(list.id, boardId)
  }

  const handleColorChange = async (color: string) => {
    await updateList(list.id, boardId, { color })
    setShowColorPicker(false)
    setShowMenu(false)
  }

  const handleAddCardKeyDown = async (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const trimmed = newCardTitle.trim()
      if (trimmed && profile) {
        await createCard({
          list_id: list.id,
          title: trimmed,
          created_by: profile.id,
          position: list.cards.length,
        })
        logCardCreated(boardId, profile.id, trimmed)
        await useBoardStore.getState().fetchBoard(boardId)
        setNewCardTitle('')
        setIsAddingCard(false)
      }
    }
    if (e.key === 'Escape') {
      setNewCardTitle('')
      setIsAddingCard(false)
    }
  }

  const sortedCards = [...list.cards].sort((a, b) => a.position - b.position)
  const cardIds = sortedCards.map((c) => c.id)

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: `column-droppable-${list.id}`,
    data: { type: 'column', listId: list.id },
  })

  const cardCount = list.cards.length
  const cardLabel = cardCount === 1 ? '1 card' : `${cardCount} cards`

  // ---- Collapsed mode ----
  if (isCollapsed) {
    return (
      <motion.div
        initial={{ width: 288, opacity: 1 }}
        animate={{ width: 44, opacity: 1 }}
        exit={{ width: 288, opacity: 1 }}
        transition={{ duration: 0.2, ease: 'easeInOut' }}
        className="flex-shrink-0 h-full"
      >
        <div
          className="bg-surface rounded-card shadow-card h-full min-h-[200px] flex flex-col items-center pt-3 pb-4 cursor-pointer"
          style={{ borderTop: `3px solid ${list.color}` }}
          onClick={() => toggleListCollapse(list.id)}
        >
          <ChevronRight size={16} className="text-ink/40 mb-3 flex-shrink-0" />
          <div className="flex-1 flex items-center">
            <span
              className="font-display text-sm text-ink whitespace-nowrap"
              style={{
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
              }}
            >
              {list.title}
            </span>
          </div>
          <span
            className="font-body text-xs text-ink/40 mt-3 flex-shrink-0"
            style={{
              writingMode: 'vertical-rl',
              textOrientation: 'mixed',
            }}
          >
            {cardLabel}
          </span>
        </div>
      </motion.div>
    )
  }

  // ---- Expanded mode ----
  return (
    <motion.div
      initial={{ width: 288, opacity: 0 }}
      animate={{ width: 288, opacity: 1 }}
      exit={{ width: 44, opacity: 1 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="flex-shrink-0 w-72"
    >
      <div
        className="bg-surface rounded-card shadow-card flex flex-col max-h-[calc(100vh-160px)]"
        style={{ borderTop: `3px solid ${list.color}` }}
      >
        {/* Header */}
        <div className="px-3 pt-3 pb-2 flex items-center gap-2">
          {/* Drag handle */}
          {dragHandleProps && (
            <button
              {...dragHandleProps}
              className="p-1 rounded-lg text-ink/20 hover:text-ink/60 cursor-grab active:cursor-grabbing transition-colors duration-hover flex-shrink-0"
              aria-label="Arrastrar lista"
            >
              <GripVertical size={16} />
            </button>
          )}

          {/* Collapse button */}
          <button
            onClick={() => toggleListCollapse(list.id)}
            className="p-1 rounded-lg text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors duration-hover flex-shrink-0"
            aria-label="Colapsar lista"
          >
            <ChevronDown size={16} />
          </button>

          {/* Title */}
          <div className="flex-1 min-w-0">
            {isEditingTitle ? (
              <div className="relative">
                <div className="flex items-center gap-1">
                  {/* Emoji button */}
                  <button
                    onMouseDown={(e) => { e.preventDefault(); setShowEmojiPicker((v) => !v) }}
                    className={cn(
                      'flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center text-sm transition-colors',
                      showEmojiPicker ? 'bg-accent-yellow/40' : 'hover:bg-ink/5'
                    )}
                  >
                    {emojiDraft ? emojiDraft : <Smile size={13} className="text-ink/30" />}
                  </button>
                  <input
                    ref={titleInputRef}
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={handleTitleKeyDown}
                    className="w-full bg-transparent font-display text-base text-ink outline-none border-b-2 border-accent-yellow/60 py-0.5"
                  />
                </div>

                {/* Emoji picker inline */}
                <AnimatePresence>
                  {showEmojiPicker && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-full left-0 mt-1 z-30 bg-surface rounded-xl shadow-card-hover border border-ink/5 p-2"
                      onMouseDown={(e) => e.preventDefault()}
                    >
                      <div className="grid grid-cols-8 gap-1">
                        {EMOJIS.map((e) => (
                          <button
                            key={e}
                            onClick={() => { setEmojiDraft(e === emojiDraft ? '' : e); setShowEmojiPicker(false); titleInputRef.current?.focus() }}
                            className={cn(
                              'w-7 h-7 flex items-center justify-center rounded-lg text-base transition-all hover:scale-125',
                              emojiDraft === e ? 'bg-accent-yellow/40' : 'hover:bg-cream'
                            )}
                          >
                            {e}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={handleStartEditTitle}
                className="w-full text-left font-display text-base text-ink truncate hover:text-ink/80 transition-colors duration-hover py-0.5"
              >
                {list.title}
              </button>
            )}
          </div>

          {/* Card count */}
          <span className="font-body text-xs text-ink/40 flex-shrink-0 whitespace-nowrap">
            {cardLabel}
          </span>

          {/* Menu button */}
          <div className="relative flex-shrink-0" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 rounded-lg text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors duration-hover"
              aria-label="Opciones de lista"
            >
              <MoreHorizontal size={16} />
            </button>

            {/* Dropdown menu */}
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  transition={{ duration: 0.1 }}
                  className="absolute right-0 top-full mt-1 z-20 bg-surface rounded-xl shadow-card-hover border border-ink/5 py-1 min-w-[160px]"
                >
                  {!showColorPicker ? (
                    <>
                      <button
                        onClick={() => setShowColorPicker(true)}
                        className="w-full px-3 py-2 text-left font-body text-sm text-ink flex items-center gap-2 hover:bg-cream transition-colors duration-hover"
                      >
                        <Palette size={14} />
                        Cambiar color
                      </button>
                      <button
                        onClick={handleDeleteList}
                        className="w-full px-3 py-2 text-left font-body text-sm text-red-600 flex items-center gap-2 hover:bg-red-50 transition-colors duration-hover"
                      >
                        <Trash2 size={14} />
                        Eliminar lista
                      </button>
                    </>
                  ) : (
                    <div className="px-3 py-2">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-body text-xs text-ink/60">
                          Color
                        </span>
                        <button
                          onClick={() => setShowColorPicker(false)}
                          className="p-0.5 rounded text-ink/40 hover:text-ink transition-colors duration-hover"
                        >
                          <X size={12} />
                        </button>
                      </div>
                      <div className="flex gap-1.5 flex-wrap">
                        {COLOR_PALETTE.map((color) => (
                          <button
                            key={color}
                            onClick={() => handleColorChange(color)}
                            className={cn(
                              'w-7 h-7 rounded-lg border-2 transition-all duration-hover hover:scale-110',
                              list.color === color
                                ? 'border-ink/40 ring-1 ring-ink/10'
                                : 'border-transparent'
                            )}
                            style={{ backgroundColor: color }}
                            aria-label={`Color ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Cards area */}
        <div
          ref={setDroppableRef}
          className="flex-1 overflow-y-auto px-3 pb-2 space-y-2 min-h-[8px]"
        >
          <SortableContext
            items={cardIds}
            strategy={verticalListSortingStrategy}
          >
            {sortedCards.map((card) => (
              <SortableCard
                key={card.id}
                card={card}
                onClick={() => setSelectedCard(card)}
              />
            ))}
          </SortableContext>

          {/* Add card inline input */}
          <AnimatePresence>
            {isAddingCard && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
              >
                <input
                  ref={cardInputRef}
                  value={newCardTitle}
                  onChange={(e) => setNewCardTitle(e.target.value)}
                  onKeyDown={handleAddCardKeyDown}
                  onBlur={() => {
                    setNewCardTitle('')
                    setIsAddingCard(false)
                  }}
                  placeholder="Titulo de la card..."
                  className="w-full bg-cream rounded-xl p-3 font-body text-sm text-ink outline-none border-2 border-accent-yellow/40 focus:border-accent-yellow placeholder:text-ink/30 transition-colors duration-hover"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Add card button */}
        {!isAddingCard && (
          <div className="px-3 pb-3">
            <button
              onClick={() => setIsAddingCard(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl font-body text-sm text-ink/40 hover:text-ink hover:bg-cream transition-all duration-hover"
            >
              <Plus size={16} />
              Agregar card
            </button>
          </div>
        )}
      </div>

      {/* Card detail modal */}
      {selectedCard && (
        <CardModal
          card={selectedCard}
          boardId={boardId}
          onClose={() => setSelectedCard(null)}
        />
      )}
    </motion.div>
  )
}
