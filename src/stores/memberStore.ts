import { create } from 'zustand'
import { supabase } from '@/lib/supabase'

interface MemberState {
  inviteMember: (boardId: string, email: string) => Promise<void>
  removeMember: (boardId: string, userId: string) => Promise<void>
  addAssignee: (cardId: string, userId: string) => Promise<void>
  removeAssignee: (cardId: string, userId: string) => Promise<void>
}

export const useMemberStore = create<MemberState>(() => ({
  inviteMember: async (boardId, email) => {
    // 1. Look up user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (userError) throw new Error(userError.message)
    if (!user) throw new Error('Usuario no encontrado')

    // 2. Check if already a member
    const { data: existing, error: checkError } = await supabase
      .from('board_members')
      .select('user_id')
      .eq('board_id', boardId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (checkError) throw new Error(checkError.message)
    if (existing) throw new Error('Ya es miembro')

    // 3. Insert into board_members
    const { error: insertError } = await supabase
      .from('board_members')
      .insert({ board_id: boardId, user_id: user.id, role: 'member' })

    if (insertError) throw new Error(insertError.message)
  },

  removeMember: async (boardId, userId) => {
    const { error } = await supabase
      .from('board_members')
      .delete()
      .eq('board_id', boardId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },

  addAssignee: async (cardId, userId) => {
    const { error } = await supabase
      .from('card_assignees')
      .insert({ card_id: cardId, user_id: userId })

    if (error) throw new Error(error.message)
  },

  removeAssignee: async (cardId, userId) => {
    const { error } = await supabase
      .from('card_assignees')
      .delete()
      .eq('card_id', cardId)
      .eq('user_id', userId)

    if (error) throw new Error(error.message)
  },
}))
