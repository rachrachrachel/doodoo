import { useState, useEffect, useCallback, useRef, type KeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Calendar, CheckSquare, Tags, Users, Plus, Paperclip, Upload, FileText } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useCardStore } from '@/stores/cardStore'
import { useBoardStore } from '@/stores/boardStore'
import { useAttachmentStore } from '@/stores/attachmentStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/Card'
import { AssigneePicker } from '@/components/cards/AssigneePicker'
import { LabelPicker } from '@/components/labels/LabelPicker'
import type { CardWithRelations, CardAttachment } from '@/types'

interface CardModalProps {
  card: CardWithRelations
  boardId: string
  onClose: () => void
}

export function CardModal({ card, boardId, onClose }: CardModalProps) {
  const { updateCard, deleteCard, createChecklistItem, toggleChecklistItem, deleteChecklistItem } = useCardStore()
  const { fetchAttachments, uploadAttachment, deleteAttachment } = useAttachmentStore()
  const currentBoard = useBoardStore((s) => s.currentBoard)
  const { profile } = useAuth()

  const [title, setTitle] = useState(card.title)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [description, setDescription] = useState(card.description ?? '')
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [dueDate, setDueDate] = useState(card.due_date ?? '')
  const [isDeleting, setIsDeleting] = useState(false)
  const [newItemText, setNewItemText] = useState('')
  const [isSubmittingItem, setIsSubmittingItem] = useState(false)
  const newItemInputRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [attachments, setAttachments] = useState<CardAttachment[]>([])
  const [isUploadingFile, setIsUploadingFile] = useState(false)
  const [deletingAttachmentId, setDeletingAttachmentId] = useState<string | null>(null)

  useEffect(() => {
    fetchAttachments(card.id).then(setAttachments).catch(console.error)
  }, [card.id])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    e.target.value = ''
    setIsUploadingFile(true)
    try {
      const attachment = await uploadAttachment(card.id, file, profile.id)
      setAttachments((prev) => [attachment, ...prev])
    } catch (err) {
      console.error(err)
    } finally {
      setIsUploadingFile(false)
    }
  }

  const handleDeleteAttachment = async (attachment: CardAttachment) => {
    setDeletingAttachmentId(attachment.id)
    try {
      await deleteAttachment(attachment)
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: globalThis.KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  const handleTitleSave = useCallback(async () => {
    const trimmed = title.trim()
    if (trimmed && trimmed !== card.title) {
      await updateCard(card.id, { title: trimmed })
      await useBoardStore.getState().fetchBoard(boardId)
    } else {
      setTitle(card.title)
    }
    setIsEditingTitle(false)
  }, [title, card.title, card.id, updateCard, boardId])

  const handleTitleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleSave()
    if (e.key === 'Escape') {
      setTitle(card.title)
      setIsEditingTitle(false)
    }
  }

  const handleDueDateChange = async (value: string) => {
    setDueDate(value)
    await updateCard(card.id, { due_date: value || null })
    await useBoardStore.getState().fetchBoard(boardId)
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteCard(card.id, card.list_id)
      await useBoardStore.getState().fetchBoard(boardId)
      onClose()
    } catch {
      setIsDeleting(false)
    }
  }

  // Always use the live version from the store so checklist updates are reflected immediately
  const liveCard: CardWithRelations =
    currentBoard?.lists.flatMap((l) => l.cards).find((c) => c.id === card.id) ?? card

  const descriptionDirty = description !== (liveCard.description ?? '')

  const handleDescriptionSave = async () => {
    if (!descriptionDirty || isSavingDescription) return
    setIsSavingDescription(true)
    try {
      const trimmed = description.trim()
      await updateCard(card.id, { description: trimmed || null })
      useBoardStore.getState().fetchBoard(boardId)
    } finally {
      setIsSavingDescription(false)
    }
  }

  const handleDescriptionCancel = () => {
    setDescription(liveCard.description ?? '')
  }

  const handleDescriptionKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      handleDescriptionSave()
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      handleDescriptionCancel()
    }
  }

  const handleToggleItem = async (itemId: string, completed: boolean) => {
    await toggleChecklistItem(itemId, liveCard.id, completed)
    await useBoardStore.getState().fetchBoard(boardId)
  }

  const handleDeleteItem = async (itemId: string) => {
    await deleteChecklistItem(itemId, liveCard.id)
    await useBoardStore.getState().fetchBoard(boardId)
  }

  const handleAddItem = async () => {
    const trimmed = newItemText.trim()
    if (!trimmed || isSubmittingItem) return
    setIsSubmittingItem(true)
    try {
      const nextPosition = liveCard.checklist_items.length
        ? Math.max(...liveCard.checklist_items.map((i) => i.position)) + 1
        : 0
      await createChecklistItem(liveCard.id, trimmed, nextPosition)
      await useBoardStore.getState().fetchBoard(boardId)
      setNewItemText('')
    } finally {
      setIsSubmittingItem(false)
    }
  }

  const handleNewItemKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddItem()
    }
    if (e.key === 'Escape') {
      e.stopPropagation()
      setNewItemText('')
      newItemInputRef.current?.blur()
    }
  }

  const hasChecklist = liveCard.checklist_items && liveCard.checklist_items.length > 0
  const checklistCompleted = hasChecklist
    ? liveCard.checklist_items.filter((item) => item.completed).length
    : 0
  const checklistTotal = hasChecklist ? liveCard.checklist_items.length : 0

  const boardMembers = currentBoard?.members ?? []

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-ink/40"
          onClick={onClose}
        />

        {/* Panel */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 40, scale: 0.98 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className={cn(
            'relative w-full max-w-2xl max-h-[85vh] overflow-y-auto',
            'bg-surface rounded-card shadow-card-hover p-6'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start gap-3 mb-6">
            <div className="flex-1 min-w-0">
              {isEditingTitle ? (
                <input
                  autoFocus
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={handleTitleKeyDown}
                  className="w-full bg-transparent font-display text-2xl text-ink outline-none border-b-2 border-accent-yellow/60 pb-1"
                />
              ) : (
                <h2
                  onClick={() => setIsEditingTitle(true)}
                  className="font-display text-2xl text-ink cursor-pointer hover:text-ink/80 transition-colors duration-hover break-words"
                >
                  {card.title}
                </h2>
              )}
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 p-1.5 rounded-xl text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors duration-hover"
              aria-label="Cerrar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Description */}
          <section className="mb-6">
            <h3 className="font-display text-sm text-ink/60 mb-2">
              Descripcion
            </h3>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleDescriptionKeyDown}
              placeholder="Agregar descripcion..."
              rows={3}
              className={cn(
                'w-full bg-cream rounded-xl p-3 font-body text-sm text-ink resize-none',
                'outline-none border-2 border-transparent',
                'focus:border-accent-yellow/40 placeholder:text-ink/30',
                'transition-colors duration-hover'
              )}
            />
            {descriptionDirty && (
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={handleDescriptionSave}
                  disabled={isSavingDescription}
                  className={cn(
                    'px-3 py-1 rounded-xl font-body text-xs text-ink bg-accent-yellow',
                    'hover:bg-accent-yellow/80 transition-colors duration-[100ms]',
                    'disabled:opacity-50'
                  )}
                >
                  {isSavingDescription ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={handleDescriptionCancel}
                  className="px-3 py-1 rounded-xl font-body text-xs text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors duration-[100ms]"
                >
                  Cancelar
                </button>
                <span className="font-body text-xs text-ink/30">o Ctrl+Enter</span>
              </div>
            )}
          </section>

          {/* Due date */}
          <section className="mb-6">
            <h3 className="font-display text-sm text-ink/60 mb-2 flex items-center gap-1.5">
              <Calendar size={14} />
              Fecha limite
            </h3>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => handleDueDateChange(e.target.value)}
              className={cn(
                'bg-cream rounded-xl px-3 py-2 font-body text-sm text-ink',
                'outline-none border-2 border-transparent',
                'focus:border-accent-yellow/40',
                'transition-colors duration-hover'
              )}
            />
          </section>

          {/* Labels */}
          <section className="mb-6">
            <h3 className="font-display text-sm text-ink/60 mb-2 flex items-center gap-1.5">
              <Tags size={14} />
              Etiquetas
            </h3>
            <LabelPicker
              cardId={liveCard.id}
              boardId={boardId}
              cardLabels={liveCard.labels}
              boardLabels={currentBoard?.boardLabels ?? []}
            />
          </section>

          {/* Checklist */}
          <section className="mb-6">
            <h3 className="font-display text-sm text-ink/60 mb-2 flex items-center gap-1.5">
              <CheckSquare size={14} />
              Checklist
            </h3>

            <div className="space-y-3">
              {hasChecklist && (
                <ProgressBar completed={checklistCompleted} total={checklistTotal} />
              )}

              <ul className="space-y-1">
                <AnimatePresence initial={false}>
                  {liveCard.checklist_items
                    .slice()
                    .sort((a, b) => a.position - b.position)
                    .map((item) => (
                      <motion.li
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="group flex items-center gap-2 overflow-hidden"
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={(e) => handleToggleItem(item.id, e.target.checked)}
                          className="w-4 h-4 flex-shrink-0 rounded border-ink/20 accent-accent-yellow cursor-pointer transition-opacity duration-[150ms] ease-out"
                        />
                        <motion.span
                          animate={{
                            opacity: item.completed ? 0.4 : 1,
                            textDecoration: item.completed ? 'line-through' : 'none',
                          }}
                          transition={{ duration: 0.15, ease: 'easeOut' }}
                          className="font-body text-sm text-ink flex-1 min-w-0 break-words"
                        >
                          {item.text}
                        </motion.span>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          aria-label="Eliminar item"
                          className={cn(
                            'flex-shrink-0 p-1 rounded-lg text-ink/30',
                            'opacity-0 group-hover:opacity-100',
                            'hover:text-red-500 hover:bg-red-50',
                            'transition-all duration-[150ms] ease-out'
                          )}
                        >
                          <Trash2 size={13} />
                        </button>
                      </motion.li>
                    ))}
                </AnimatePresence>
              </ul>

              {/* Add new item */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={!newItemText.trim() || isSubmittingItem}
                  aria-label="Agregar item"
                  className="flex-shrink-0 p-0.5 rounded-md text-ink/30 hover:text-accent-yellow disabled:opacity-30 transition-colors duration-[100ms]"
                >
                  <Plus size={14} />
                </button>
                <input
                  ref={newItemInputRef}
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={handleNewItemKeyDown}
                  placeholder="Agregar item y presiona Enter..."
                  disabled={isSubmittingItem}
                  className={cn(
                    'flex-1 bg-transparent font-body text-sm text-ink',
                    'outline-none border-b border-transparent',
                    'focus:border-accent-yellow/50',
                    'placeholder:text-ink/30',
                    'transition-colors duration-[150ms] ease-out',
                    'disabled:opacity-50'
                  )}
                />
                {newItemText.trim() && (
                  <button
                    type="button"
                    onClick={handleAddItem}
                    disabled={isSubmittingItem}
                    className={cn(
                      'flex-shrink-0 px-2.5 py-1 rounded-xl font-body text-xs text-ink bg-accent-yellow',
                      'hover:bg-accent-yellow/80 transition-colors duration-[100ms]',
                      'disabled:opacity-50'
                    )}
                  >
                    {isSubmittingItem ? '...' : 'Agregar'}
                  </button>
                )}
              </div>
            </div>
          </section>

          {/* Assignees */}
          <section className="mb-8">
            <h3 className="font-display text-sm text-ink/60 mb-2 flex items-center gap-1.5">
              <Users size={14} />
              Asignados
            </h3>
            <AssigneePicker
              cardId={liveCard.id}
              boardId={boardId}
              assignees={liveCard.assignees}
              boardMembers={boardMembers}
            />
          </section>

          {/* Attachments */}
          <section className="mb-6">
            <h3 className="font-display text-sm text-ink/60 mb-2 flex items-center gap-1.5">
              <Paperclip size={14} />
              Adjuntos
            </h3>

            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploadingFile}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl font-body text-sm',
                'bg-cream text-ink/60 hover:text-ink hover:bg-ink/5',
                'border-2 border-dashed border-ink/15 hover:border-ink/30',
                'transition-all duration-hover disabled:opacity-50'
              )}
            >
              <Upload size={13} />
              {isUploadingFile ? 'Subiendo...' : 'Subir archivo'}
            </button>

            {attachments.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {attachments.map((att) => (
                  <li
                    key={att.id}
                    className="group flex items-center gap-2.5 px-3 py-2 bg-cream rounded-xl"
                  >
                    <FileText size={14} className="flex-shrink-0 text-ink/40" />
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-0"
                    >
                      <p className="font-body text-sm text-ink truncate hover:underline">
                        {att.name}
                      </p>
                      {att.size !== null && (
                        <p className="font-body text-xs text-ink/40">
                          {formatFileSize(att.size)}
                        </p>
                      )}
                    </a>
                    <button
                      onClick={() => handleDeleteAttachment(att)}
                      disabled={deletingAttachmentId === att.id}
                      aria-label="Eliminar adjunto"
                      className={cn(
                        'flex-shrink-0 p-1 rounded-lg text-ink/30',
                        'opacity-0 group-hover:opacity-100',
                        'hover:text-red-500 hover:bg-red-50',
                        'transition-all duration-[150ms] ease-out',
                        'disabled:opacity-30'
                      )}
                    >
                      <Trash2 size={13} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Delete button */}
          <div className="border-t border-ink/5 pt-4">
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              <Trash2 size={14} />
              {isDeleting ? 'Eliminando...' : 'Eliminar card'}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )

  return createPortal(modalContent, document.body)
}
