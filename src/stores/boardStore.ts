import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Board, BoardWithLists } from '@/types'

interface BoardState {
  boards: Board[]
  currentBoard: BoardWithLists | null
  isLoading: boolean
  error: string | null

  fetchBoards: () => Promise<void>
  fetchBoard: (id: string) => Promise<void>
  createBoard: (data: Pick<Board, 'title' | 'description' | 'cover_color'> & { owner_id: string }) => Promise<Board>
  updateBoard: (id: string, data: Partial<Pick<Board, 'title' | 'description' | 'cover_color'>>) => Promise<void>
  deleteBoard: (id: string) => Promise<void>
}

export const useBoardStore = create<BoardState>((set) => ({
  boards: [],
  currentBoard: null,
  isLoading: false,
  error: null,

  fetchBoards: async () => {
    set({ isLoading: true, error: null })
    const { data, error } = await supabase
      .from('boards')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) set({ error: error.message })
    else set({ boards: data ?? [] })
    set({ isLoading: false })
  },

  fetchBoard: async (id) => {
    set({ isLoading: true, error: null })
    const { data, error } = await supabase
      .from('boards')
      .select(`
        *,
        labels (*),
        board_members ( role, users(*) ),
        lists (
          *,
          cards (
            *,
            card_assignees ( users(*) ),
            card_labels ( labels(*) ),
            checklist_items ( * )
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      set({ error: error.message })
    } else {
      const transformed = {
        ...data,
        boardLabels: (data as any).labels || [],
        members: ((data as any).board_members || [])
          .map((bm: any) => bm.users)
          .filter(Boolean),
        lists: ((data as any).lists || []).map((list: any) => ({
          ...list,
          cards: (list.cards || []).map((card: any) => ({
            ...card,
            assignees: (card.card_assignees || [])
              .map((ca: any) => ca.users)
              .filter(Boolean),
            labels: (card.card_labels || [])
              .map((cl: any) => cl.labels)
              .filter(Boolean),
          })),
        })),
      }
      set({ currentBoard: transformed as unknown as BoardWithLists })
    }
    set({ isLoading: false })
  },

  createBoard: async (data) => {
    const { data: board, error } = await supabase
      .from('boards')
      .insert(data)
      .select()
      .single()

    if (error) throw new Error(error.message)

    // Agrega al owner como miembro del board
    await supabase.from('board_members').insert({
      board_id: board.id,
      user_id: data.owner_id,
      role: 'owner',
    })

    set((s) => ({ boards: [board, ...s.boards] }))
    return board
  },

  updateBoard: async (id, data) => {
    const { error } = await supabase.from('boards').update(data).eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      boards: s.boards.map((b) => (b.id === id ? { ...b, ...data } : b)),
    }))
  },

  deleteBoard: async (id) => {
    const { error } = await supabase.from('boards').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({ boards: s.boards.filter((b) => b.id !== id) }))
  },
}))
