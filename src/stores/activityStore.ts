import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { ActivityLog } from '@/types'

// Extended type with user data from join
export interface ActivityLogWithUser extends ActivityLog {
  users?: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

interface ActivityState {
  activities: ActivityLogWithUser[]
  isLoading: boolean

  fetchActivities: (boardId: string) => Promise<void>
  logActivity: (entry: {
    board_id: string
    user_id: string
    action: string
    metadata?: Record<string, unknown>
  }) => Promise<void>
}

export const useActivityStore = create<ActivityState>((set) => ({
  activities: [],
  isLoading: false,

  fetchActivities: async (boardId) => {
    set({ isLoading: true })
    try {
      const { data, error } = await supabase
        .from('activity_log')
        .select('*, users(full_name, avatar_url)')
        .eq('board_id', boardId)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.warn('[ActivityStore] fetchActivities error:', error.message)
      } else {
        set({ activities: (data ?? []) as unknown as ActivityLogWithUser[] })
      }
    } finally {
      set({ isLoading: false })
    }
  },

  logActivity: async (entry) => {
    try {
      const { error } = await supabase.from('activity_log').insert({
        board_id: entry.board_id,
        user_id: entry.user_id,
        action: entry.action,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        metadata: (entry.metadata ?? null) as any,
      })

      if (error) {
        console.warn('[ActivityStore] logActivity error:', error.message)
      }
    } catch (err) {
      console.warn('[ActivityStore] logActivity unexpected error:', err)
    }
  },
}))
