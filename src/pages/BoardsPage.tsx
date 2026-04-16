import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useBoards } from '@/hooks/useBoard'
import { useBoardStore } from '@/stores/boardStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

export function BoardsPage() {
  const { boards, isLoading } = useBoards()
  const { createBoard } = useBoardStore()
  const { profile, isLoaded } = useAuth()
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
            <button
              key={board.id}
              onClick={() => navigate(`/board/${board.id}`)}
              className="text-left p-5 bg-surface rounded-card shadow-card hover:shadow-card-hover transition-shadow duration-card"
              style={{ backgroundColor: board.cover_color }}
            >
              <h3 className="font-display text-xl text-ink mb-1">{board.title}</h3>
              {board.description && (
                <p className="font-body text-sm text-ink/60 line-clamp-2">{board.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}
