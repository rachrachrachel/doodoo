import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { Label } from '@/types'

interface LabelState {
  isLoading: boolean
  error: string | null

  createLabel: (boardId: string, name: string, color: string) => Promise<Label>
  updateLabel: (id: string, data: { name?: string; color?: string }) => Promise<void>
  deleteLabel: (id: string) => Promise<void>
  addLabelToCard: (cardId: string, labelId: string) => Promise<void>
  removeLabelFromCard: (cardId: string, labelId: string) => Promise<void>
}

export const useLabelStore = create<LabelState>(() => ({
  isLoading: false,
  error: null,

  createLabel: async (boardId, name, color) => {
    const { data, error } = await supabase
      .from('labels')
      .insert({ board_id: boardId, name, color })
      .select()
      .single()

    if (error) throw new Error(error.message)
    return data as Label
  },

  updateLabel: async (id, data) => {
    const { error } = await supabase
      .from('labels')
      .update(data)
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  deleteLabel: async (id) => {
    const { error } = await supabase
      .from('labels')
      .delete()
      .eq('id', id)

    if (error) throw new Error(error.message)
  },

  addLabelToCard: async (cardId, labelId) => {
    const { error } = await supabase
      .from('card_labels')
      .insert({ card_id: cardId, label_id: labelId })

    if (error) throw new Error(error.message)
  },

  removeLabelFromCard: async (cardId, labelId) => {
    const { error } = await supabase
      .from('card_labels')
      .delete()
      .eq('card_id', cardId)
      .eq('label_id', labelId)

    if (error) throw new Error(error.message)
  },
}))
