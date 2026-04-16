import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useBoardStore } from '@/stores/boardStore'

interface ListState {
  isLoading: boolean
  error: string | null

  createList: (data: {
    board_id: string
    title: string
    color?: string
    position: number
  }) => Promise<void>

  updateList: (
    id: string,
    boardId: string,
    data: { title?: string; color?: string }
  ) => Promise<void>

  deleteList: (id: string, boardId: string) => Promise<void>

  reorderLists: (
    boardId: string,
    lists: { id: string; position: number }[]
  ) => Promise<void>
}

export const useListStore = create<ListState>((set) => ({
  isLoading: false,
  error: null,

  createList: async (data) => {
    set({ isLoading: true, error: null })
    const { error } = await supabase.from('lists').insert({
      board_id: data.board_id,
      title: data.title,
      color: data.color ?? '#F5F3EE',
      position: data.position,
    })

    if (error) {
      set({ error: error.message, isLoading: false })
      throw new Error(error.message)
    }

    await useBoardStore.getState().fetchBoard(data.board_id)
    set({ isLoading: false })
  },

  updateList: async (id, boardId, data) => {
    set({ isLoading: true, error: null })
    const { error } = await supabase.from('lists').update(data).eq('id', id)

    if (error) {
      set({ error: error.message, isLoading: false })
      throw new Error(error.message)
    }

    await useBoardStore.getState().fetchBoard(boardId)
    set({ isLoading: false })
  },

  deleteList: async (id, boardId) => {
    set({ isLoading: true, error: null })
    const { error } = await supabase.from('lists').delete().eq('id', id)

    if (error) {
      set({ error: error.message, isLoading: false })
      throw new Error(error.message)
    }

    await useBoardStore.getState().fetchBoard(boardId)
    set({ isLoading: false })
  },

  reorderLists: async (boardId, lists) => {
    set({ isLoading: true, error: null })

    const updates = lists.map((l) =>
      supabase.from('lists').update({ position: l.position }).eq('id', l.id)
    )

    const results = await Promise.all(updates)
    const failed = results.find((r) => r.error)

    if (failed?.error) {
      set({ error: failed.error.message, isLoading: false })
      throw new Error(failed.error.message)
    }

    await useBoardStore.getState().fetchBoard(boardId)
    set({ isLoading: false })
  },
}))
