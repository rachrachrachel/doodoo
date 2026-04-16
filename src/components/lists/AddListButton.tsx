import { useState, useRef, useEffect, type KeyboardEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Smile } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useListStore } from '@/stores/listStore'
import { useAuth } from '@/hooks/useAuth'
import { logListCreated } from '@/utils/activityLogger'
import type { ListWithCards } from '@/types'

const EMOJIS = [
  '🚀', '⭐', '🔥', '💡', '🎯', '📌', '✅', '⚡',
  '🎨', '🛠️', '📦', '🐛', '💬', '🔍', '📝', '🎉',
  '❤️', '🟡', '🟣', '🔵', '🟢', '🟠', '⚪', '⚫',
]

interface AddListButtonProps {
  boardId: string
  lists: ListWithCards[]
}

export function AddListButton({ boardId, lists }: AddListButtonProps) {
  const { createList } = useListStore()
  const { profile } = useAuth()
  const [isAdding, setIsAdding] = useState(false)
  const [title, setTitle] = useState('')
  const [emoji, setEmoji] = useState('')
  const [showEmojis, setShowEmojis] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isAdding])

  const handleSubmit = async () => {
    const trimmed = title.trim()
    if (!trimmed) return

    const maxPosition = lists.reduce((max, l) => Math.max(max, l.position), -1)
    const fullTitle = emoji ? `${emoji} ${trimmed}` : trimmed

    await createList({
      board_id: boardId,
      title: fullTitle,
      color: '#F5F3EE',
      position: maxPosition + 1,
    })

    if (profile) logListCreated(boardId, profile.id, fullTitle)

    setTitle('')
    setEmoji('')
    setShowEmojis(false)
    setIsAdding(false)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSubmit()
    if (e.key === 'Escape') {
      setTitle('')
      setEmoji('')
      setShowEmojis(false)
      setIsAdding(false)
    }
  }

  const handleCancel = () => {
    setTitle('')
    setEmoji('')
    setShowEmojis(false)
    setIsAdding(false)
  }

  return (
    <div className="flex-shrink-0 w-72">
      <AnimatePresence mode="wait">
        {!isAdding ? (
          <motion.button
            key="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={() => setIsAdding(true)}
            className={cn(
              'w-full h-24 flex flex-col items-center justify-center gap-2',
              'bg-surface/60 hover:bg-surface rounded-card',
              'border-2 border-dashed border-ink/10 hover:border-ink/20',
              'transition-all duration-hover cursor-pointer group'
            )}
          >
            <div className="w-8 h-8 rounded-xl bg-cream flex items-center justify-center group-hover:bg-accent-yellow/30 transition-colors duration-hover">
              <Plus size={18} className="text-ink/40 group-hover:text-ink transition-colors duration-hover" />
            </div>
            <span className="font-body text-sm text-ink/40 group-hover:text-ink/60 transition-colors duration-hover">
              Agregar lista
            </span>
          </motion.button>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-surface rounded-card shadow-card p-3"
            style={{ borderTop: '3px solid #F5F3EE' }}
          >
            {/* Input con botón de emoji */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowEmojis((v) => !v)}
                className={cn(
                  'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-hover text-lg',
                  showEmojis ? 'bg-accent-yellow/30' : 'bg-cream hover:bg-accent-yellow/20'
                )}
                title="Agregar emoji"
              >
                {emoji ? emoji : <Smile size={16} className="text-ink/40" />}
              </button>
              <input
                ref={inputRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Nombre de la lista..."
                className="flex-1 bg-transparent font-display text-base text-ink outline-none border-b-2 border-accent-yellow/40 focus:border-accent-yellow pb-1 placeholder:text-ink/30 transition-colors duration-hover"
              />
            </div>

            {/* Emoji picker */}
            <AnimatePresence>
              {showEmojis && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-8 gap-1 mt-3 p-2 bg-cream rounded-xl">
                    {EMOJIS.map((e) => (
                      <button
                        key={e}
                        onClick={() => {
                          setEmoji(e === emoji ? '' : e)
                          setShowEmojis(false)
                          inputRef.current?.focus()
                        }}
                        className={cn(
                          'w-7 h-7 flex items-center justify-center rounded-lg text-base transition-all duration-hover hover:scale-125',
                          emoji === e ? 'bg-accent-yellow/40 ring-1 ring-accent-yellow' : 'hover:bg-white'
                        )}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Preview del título + botones */}
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className={cn(
                  'px-4 py-1.5 rounded-xl font-body text-sm font-medium transition-all duration-hover',
                  title.trim()
                    ? 'bg-accent-yellow text-ink hover:brightness-95'
                    : 'bg-ink/5 text-ink/30 cursor-not-allowed'
                )}
              >
                Crear lista
              </button>
              <button
                onClick={handleCancel}
                className="p-1.5 rounded-lg text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors duration-hover"
                aria-label="Cancelar"
              >
                <X size={16} />
              </button>
              {emoji && (
                <button
                  onClick={() => setEmoji('')}
                  className="ml-auto font-body text-xs text-ink/30 hover:text-ink/60 transition-colors"
                >
                  Quitar emoji
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
