import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Token de Clerk — se actualiza via setSupabaseToken()
let clerkToken: string | null = null

export function setSupabaseToken(token: string | null) {
  clerkToken = token
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: async (input, init = {}) => {
      const headers = new Headers(init.headers)
      if (clerkToken) {
        headers.set('Authorization', `Bearer ${clerkToken}`)
      }
      return fetch(input, { ...init, headers })
    },
  },
  auth: { persistSession: false },
})
