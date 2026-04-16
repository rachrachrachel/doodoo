import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { useBoards } from '@/hooks/useBoard'
import { useBoardStore } from '@/stores/boardStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export function BoardsPage() {
  const { boards, isLoading } = useBoards()
  const { createBoard, deleteBoard } = useBoardStore()
  const { profile, isLoaded } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  async function handleDeleteBoard(id: string) {
    setDeleting(true)
    try {
      await deleteBoard(id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar el board')
    } finally {
      setDeleting(false)
      setConfirmingDeleteId(null)
    }
  }

  async function handleCreate() {
    if (!profile) return
    setCreating(true)
    setError(null)
    try {
      const board = await createBoard({
        title: 'Nuevo board',
        description: null,
        cover_color: '#F5F3EE',
        owner_id: profile.id,
      })
      navigate(`/board/${board.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear el board')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <h2 className="font-display text-3xl text-ink">Mis boards</h2>
        <Button onClick={handleCreate} disabled={creating || !isLoaded || !profile}>
          <Plus size={16} />
          {creating ? 'Creando...' : 'Nuevo board'}
        </Button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm font-body">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="text-ink/40 font-body">Cargando...</div>
      ) : boards.length === 0 ? (
        <div className="text-center py-24 text-ink/40 font-body">
          <p className="text-lg">Aún no tienes boards.</p>
          <p className="text-sm mt-1">Crea uno para empezar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {boards.map((board) => (
            <div
              key={board.id}
              className="group relative text-left p-5 rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-card cursor-pointer"
              style={{ backgroundColor: board.cover_color }}
              onClick={() => confirmingDeleteId !== board.id && navigate(`/board/${board.id}`)}
            >
              <h3 className="font-display text-xl text-ink mb-1">{board.title}</h3>
              {board.description && (
                <p className="font-body text-sm text-ink/60 line-clamp-2">{board.description}</p>
              )}

              {/* Delete button — aparece al hacer hover */}
              {confirmingDeleteId === board.id ? (
                <div
                  className="absolute top-3 right-3 flex items-center gap-1"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => handleDeleteBoard(board.id)}
                    disabled={deleting}
                    className="px-2 py-1 rounded-lg bg-red-600 text-white font-body text-xs hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {deleting ? '...' : 'Eliminar'}
                  </button>
                  <button
                    onClick={() => setConfirmingDeleteId(null)}
                    className="px-2 py-1 rounded-lg bg-ink/10 font-body text-xs text-ink hover:bg-ink/20 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); setConfirmingDeleteId(board.id) }}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-ink/0 group-hover:text-ink/40 hover:!text-red-600 hover:bg-red-50 transition-all duration-hover"
                  aria-label="Eliminar board"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

    </div>
  )
}
