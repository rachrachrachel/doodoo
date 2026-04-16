import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { CardWithRelations } from '@/types'

interface CardState {
  cardsByList: Record<string, CardWithRelations[]>
  isLoading: boolean

  moveCard: (cardId: string, fromListId: string, toListId: string, newPosition: number) => Promise<void>
  createCard: (data: { list_id: string; title: string; created_by: string; position: number }) => Promise<void>
  updateCard: (id: string, data: Partial<CardWithRelations>) => Promise<void>
  deleteCard: (id: string, listId: string) => Promise<void>
  createChecklistItem: (cardId: string, text: string, position: number) => Promise<void>
  toggleChecklistItem: (itemId: string, cardId: string, completed: boolean) => Promise<void>
  deleteChecklistItem: (itemId: string, cardId: string) => Promise<void>
}

export const useCardStore = create<CardState>((set) => ({
  cardsByList: {},
  isLoading: false,

  moveCard: async (cardId, fromListId, toListId, newPosition) => {
    // Optimistic update
    set((s) => {
      const from = [...(s.cardsByList[fromListId] ?? [])]
      const to = fromListId === toListId ? from : [...(s.cardsByList[toListId] ?? [])]
      const card = from.find((c) => c.id === cardId)
      if (!card) return s

      const filtered = from.filter((c) => c.id !== cardId)
      to.splice(newPosition, 0, { ...card, list_id: toListId })

      return {
        cardsByList: {
          ...s.cardsByList,
          [fromListId]: filtered,
          [toListId]: to,
        },
      }
    })

    await supabase
      .from('cards')
      .update({ list_id: toListId, position: newPosition })
      .eq('id', cardId)
  },

  createCard: async (data) => {
    const { data: card, error } = await supabase
      .from('cards')
      .insert(data)
      .select()
      .single()

    if (error) throw new Error(error.message)

    set((s) => ({
      cardsByList: {
        ...s.cardsByList,
        [data.list_id]: [...(s.cardsByList[data.list_id] ?? []), card as CardWithRelations],
      },
    }))
  },

  updateCard: async (id, data) => {
    const { title, description, due_date, position, list_id } = data
    const { error } = await supabase.from('cards').update({ title, description, due_date, position, list_id }).eq('id', id)
    if (error) throw new Error(error.message)
  },

  deleteCard: async (id, listId) => {
    const { error } = await supabase.from('cards').delete().eq('id', id)
    if (error) throw new Error(error.message)
    set((s) => ({
      cardsByList: {
        ...s.cardsByList,
        [listId]: (s.cardsByList[listId] ?? []).filter((c) => c.id !== id),
      },
    }))
  },

  createChecklistItem: async (cardId, text, position) => {
    const { error } = await supabase
      .from('checklist_items')
      .insert({ card_id: cardId, text, position })
      .select()
      .single()
    if (error) throw new Error(error.message)
  },

  toggleChecklistItem: async (itemId, _cardId, completed) => {
    const { error } = await supabase
      .from('checklist_items')
      .update({ completed })
      .eq('id', itemId)
    if (error) throw new Error(error.message)
  },

  deleteChecklistItem: async (itemId, _cardId) => {
    const { error } = await supabase
      .from('checklist_items')
      .delete()
      .eq('id', itemId)
    if (error) throw new Error(error.message)
  },
}))
