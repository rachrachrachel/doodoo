import { useEffect } from 'react'
import { useBoardStore } from '@/stores/boardStore'
import { useRealtimeBoard } from '@/hooks/useRealtimeBoard'

export function useBoards() {
  const { boards, isLoading, error, fetchBoards } = useBoardStore()

  useEffect(() => {
    fetchBoards()
  }, [fetchBoards])

  return { boards, isLoading, error }
}

export function useBoard(boardId: string) {
  const { currentBoard, isLoading, error, fetchBoard } = useBoardStore()

  useEffect(() => {
    if (boardId) fetchBoard(boardId)
  }, [boardId, fetchBoard])

  useRealtimeBoard(boardId || undefined)

  return { board: currentBoard, isLoading, error }
}
