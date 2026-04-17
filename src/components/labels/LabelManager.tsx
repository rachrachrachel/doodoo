import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Pencil, Trash2, Check, Plus } from 'lucide-react'
import { cn } from '@/utils/cn'
import { useLabelStore } from '@/stores/labelStore'
import { useBoardStore } from '@/stores/boardStore'
import type { Label } from '@/types'

const PRESET_COLORS = [
  '#F2E840',
  '#D4B8F0',
  '#F0B8D0',
  '#86EFAC',
  '#93C5FD',
  '#FCA5A5',
  '#FCD34D',
  '#A5F3FC',
]

interface ColorSwatchProps {
  color: string
  selected: boolean
  onClick: () => void
}

function ColorSwatch({ color, selected, onClick }: ColorSwatchProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-7 h-7 rounded-lg border-2 transition-all duration-[100ms] flex items-center justify-center',
        selected ? 'border-ink/60 scale-110' : 'border-transparent hover:scale-105'
      )}
      style={{ backgroundColor: color }}
      aria-label={`Color ${color}`}
    >
      {selected && <Check size={12} className="text-ink/70" />}
    </button>
  )
}

interface EditRowProps {
  label: Label
  boardId: string
  onDone: () => void
}

function EditRow({ label, boardId, onDone }: EditRowProps) {
  const { updateLabel } = useLabelStore()
  const [name, setName] = useState(label.name)
  const [color, setColor] = useState(label.color)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    try {
      await updateLabel(label.id, { name: trimmed, color })
      await useBoardStore.getState().fetchBoard(boardId)
      onDone()
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-3 py-3 border-b border-ink/5">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') handleSave()
          if (e.key === 'Escape') onDone()
        }}
        className={cn(
          'w-full bg-cream rounded-xl px-3 py-2 font-body text-sm text-ink',
          'outline-none border-2 border-transparent focus:border-accent-yellow/40',
          'transition-colors duration-[100ms]'
        )}
        placeholder="Nombre de etiqueta"
      />
      <div className="flex gap-2 flex-wrap">
        {PRESET_COLORS.map((c) => (
          <ColorSwatch
            key={c}
            color={c}
            selected={color === c}
            onClick={() => setColor(c)}
          />
        ))}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !name.trim()}
          className={cn(
            'px-4 py-1.5 rounded-xl font-body text-xs text-ink bg-accent-yellow',
            'hover:bg-accent-yellow/80 transition-colors duration-[100ms]',
            'disabled:opacity-50 disabled:cursor-not-allowed'
          )}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="px-4 py-1.5 rounded-xl font-body text-xs text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors duration-[100ms]"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

interface LabelManagerProps {
  boardId: string
  boardLabels: Label[]
  onClose: () => void
}

export function LabelManager({ boardId, boardLabels, onClose }: LabelManagerProps) {
  const { createLabel, deleteLabel } = useLabelStore()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState(PRESET_COLORS[0])
  const [savingNew, setSavingNew] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleCreate = async () => {
    const trimmed = newName.trim()
    if (!trimmed || savingNew) return
    setSavingNew(true)
    try {
      await createLabel(boardId, trimmed, newColor)
      await useBoardStore.getState().fetchBoard(boardId)
      setNewName('')
      setNewColor(PRESET_COLORS[0])
      setIsCreating(false)
    } catch (err) {
      console.error(err)
    } finally {
      setSavingNew(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (deletingId) return
    setDeletingId(id)
    try {
      await deleteLabel(id)
      await useBoardStore.getState().fetchBoard(boardId)
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'w-full bg-surface rounded-card shadow-card-hover',
        'border border-ink/5 overflow-hidden'
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink/5">
        <span className="font-display text-sm text-ink">Gestionar etiquetas</span>
        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded-lg text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors duration-[100ms]"
          aria-label="Cerrar"
        >
          <X size={14} />
        </button>
      </div>

      {/* Label list */}
      <div className="px-4 py-2 max-h-72 overflow-y-auto">
        {boardLabels.length === 0 && !isCreating && (
          <p className="font-body text-sm text-ink/30 py-2 text-center">
            No hay etiquetas aun
          </p>
        )}

        <AnimatePresence initial={false}>
          {boardLabels.map((label) => (
            <motion.div
              key={label.id}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden"
            >
              {editingId === label.id ? (
                <EditRow
                  label={label}
                  boardId={boardId}
                  onDone={() => setEditingId(null)}
                />
              ) : (
                <div className="flex items-center gap-2 py-1.5 group">
                  <span
                    className="inline-block w-5 h-5 rounded-md flex-shrink-0"
                    style={{ backgroundColor: label.color }}
                  />
                  <span
                    className="flex-1 font-body text-sm text-ink truncate"
                    style={{ color: label.color }}
                  >
                    {label.name}
                  </span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-[100ms]">
                    <button
                      type="button"
                      onClick={() => setEditingId(label.id)}
                      className="p-1 rounded-lg text-ink/40 hover:text-ink hover:bg-ink/5 transition-colors duration-[100ms]"
                      aria-label="Editar etiqueta"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(label.id)}
                      disabled={deletingId === label.id}
                      className={cn(
                        'p-1 rounded-lg text-ink/40 hover:text-red-500 hover:bg-red-50',
                        'transition-colors duration-[100ms] disabled:opacity-50'
                      )}
                      aria-label="Eliminar etiqueta"
                    >
                      {deletingId === label.id ? (
                        <div className="w-3 h-3 border border-ink/30 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 size={12} />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Create new */}
      <div className="border-t border-ink/5 px-4 py-3">
        <AnimatePresence initial={false}>
          {isCreating ? (
            <motion.div
              key="create-form"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden space-y-3"
            >
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreate()
                  if (e.key === 'Escape') {
                    setIsCreating(false)
                    setNewName('')
                    setNewColor(PRESET_COLORS[0])
                  }
                }}
                className={cn(
                  'w-full bg-cream rounded-xl px-3 py-2 font-body text-sm text-ink',
                  'outline-none border-2 border-transparent focus:border-accent-yellow/40',
                  'transition-colors duration-[100ms]'
                )}
                placeholder="Nombre de etiqueta"
              />
              <div className="flex gap-2 flex-wrap">
                {PRESET_COLORS.map((c) => (
                  <ColorSwatch
                    key={c}
                    color={c}
                    selected={newColor === c}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={savingNew || !newName.trim()}
                  className={cn(
                    'px-4 py-1.5 rounded-xl font-body text-xs text-ink bg-accent-yellow',
                    'hover:bg-accent-yellow/80 transition-colors duration-[100ms]',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {savingNew ? 'Creando...' : 'Crear'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false)
                    setNewName('')
                    setNewColor(PRESET_COLORS[0])
                  }}
                  className="px-4 py-1.5 rounded-xl font-body text-xs text-ink/60 hover:text-ink hover:bg-ink/5 transition-colors duration-[100ms]"
                >
                  Cancelar
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="create-btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              type="button"
              onClick={() => setIsCreating(true)}
              className={cn(
                'w-full flex items-center gap-1.5 px-2 py-1.5 rounded-xl',
                'font-body text-sm text-ink/50 hover:text-ink hover:bg-ink/5',
                'transition-colors duration-[100ms]'
              )}
            >
              <Plus size={13} />
              Nueva etiqueta
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
