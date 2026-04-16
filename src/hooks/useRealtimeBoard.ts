import { useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { useBoardStore } from '@/stores/boardStore'

/**
 * Subscribes to Supabase Realtime changes for a board.
 * When any relevant table changes (cards, lists, board_members, card_assignees, card_labels, checklist_items),
 * it calls fetchBoard() to refresh the board data.
 *
 * Uses a debounce to avoid multiple rapid refetches when several events fire at once.
 */
export function useRealtimeBoard(boardId: string | undefined): void {
  const fetchBoard = useBoardStore((s) => s.fetchBoard)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!boardId) return

    const triggerRefetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        fetchBoard(boardId)
      }, 400)
    }

    const channel = supabase
      .channel(`board:${boardId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lists',
          filter: `board_id=eq.${boardId}`,
        },
        triggerRefetch,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'board_members',
          filter: `board_id=eq.${boardId}`,
        },
        triggerRefetch,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'cards',
        },
        triggerRefetch,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_labels',
        },
        triggerRefetch,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'card_assignees',
        },
        triggerRefetch,
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'checklist_items',
        },
        triggerRefetch,
      )
      .subscribe()

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      supabase.removeChannel(channel)
    }
  }, [boardId, fetchBoard])
}
