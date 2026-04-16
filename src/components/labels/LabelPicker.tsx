import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Tags, Settings } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLabelStore } from '@/stores/labelStore'
import { useBoardStore } from '@/stores/boardStore'
import { Badge } from '@/components/ui/Badge'
import { LabelManager } from '@/components/labels/LabelManager'
import type { Label } from '@/types'

interface LabelPickerProps {
  cardId: string
  boardId: string
  cardLabels: Label[]
  boardLabels: Label[]
}

export function LabelPicker({ cardId, boardId, cardLabels, boardLabels }: LabelPickerProps) {
  const [open, setOpen] = useState(false)
  const [showManager, setShowManager] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const { addLabelToCard, removeLabelFromCard } = useLabelStore()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setShowManager(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const isAssigned = (labelId: string) =>
    cardLabels.some((l) => l.id === labelId)

  const handleToggle = async (label: Label) => {
    if (loadingId) return
    setLoadingId(label.id)
    try {
      if (isAssigned(label.id)) {
        await removeLabelFromCard(cardId, label.id)
      } else {
        await addLabelToCard(cardId, label.id)
      }
      await useBoardStore.getState().fetchBoard(boardId)
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingId(null)
    }
  }

  const hasLabels = cardLabels.length > 0

  return (
    <div className="space-y-2">
      {/* Current labels */}
      {hasLabels && (
        <div className="flex flex-wrap gap-2">
          {cardLabels.map((label) => (
            <Badge key={label.id} label={label.name} color={label.color} />
          ))}
        </div>
      )}

      {/* Picker trigger */}
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => {
            setOpen((prev) => !prev)
            setShowManager(false)
          }}
          className={cn(
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-body text-sm',
            'bg-cream text-ink/60 hover:text-ink hover:bg-ink/5',
            'border-2 border-dashed border-ink/15 hover:border-ink/30',
            'transition-all duration-[100ms]'
          )}
        >
          <Tags size={13} />
          {hasLabels ? 'Editar etiquetas' : '+ Agregar etiqueta'}
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
                'w-64 bg-surface rounded-card shadow-card-hover',
                'border border-ink/5 overflow-hidden'
              )}
            >
              <AnimatePresence mode="wait">
                {showManager ? (
                  <motion.div
                    key="manager"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                    transition={{ duration: 0.12 }}
                  >
                    <LabelManager
                      boardId={boardId}
                      boardLabels={boardLabels}
                      onClose={() => setShowManager(false)}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="picker"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    transition={{ duration: 0.12 }}
                  >
                    {/* Label list */}
                    {boardLabels.length === 0 ? (
                      <p className="px-3 py-3 font-body text-sm text-ink/40">
                        No hay etiquetas en este board
                      </p>
                    ) : (
                      <ul className="py-1">
                        {boardLabels.map((label) => {
                          const assigned = isAssigned(label.id)
                          const isLoading = loadingId === label.id

                          return (
                            <li key={label.id}>
                              <button
                                type="button"
                                disabled={!!loadingId}
                                onClick={() => handleToggle(label)}
                                className={cn(
                                  'w-full flex items-center gap-2.5 px-3 py-2',
                                  'hover:bg-cream transition-colors duration-[100ms]',
                                  'disabled:opacity-60',
                                  assigned && 'bg-accent-yellow/10'
                                )}
                              >
                                <span
                                  className="inline-block w-5 h-5 rounded-md flex-shrink-0"
                                  style={{ backgroundColor: label.color }}
                                />
                                <span
                                  className="flex-1 font-body text-sm text-left truncate"
                                  style={{ color: label.color }}
                                >
                                  {label.name}
                                </span>
                                {isLoading ? (
                                  <div className="w-3.5 h-3.5 border-2 border-ink/30 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                                ) : assigned ? (
                                  <Check size={14} className="flex-shrink-0 text-ink/60" />
                                ) : null}
                              </button>
                            </li>
                          )
                        })}
                      </ul>
                    )}

                    {/* Manage button */}
                    <div className="border-t border-ink/5">
                      <button
                        type="button"
                        onClick={() => setShowManager(true)}
                        className={cn(
                          'w-full flex items-center gap-2 px-3 py-2',
                          'font-body text-sm text-ink/50 hover:text-ink hover:bg-cream',
                          'transition-colors duration-[100ms]'
                        )}
                      >
                        <Settings size={13} />
                        Gestionar etiquetas
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!hasLabels && !open && (
        <p className="font-body text-sm text-ink/30">Sin etiquetas</p>
      )}
    </div>
  )
}
