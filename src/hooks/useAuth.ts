import { useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'
import type { User } from '@/types'

export function useAuth() {
  const { user, isLoaded, isSignedIn } = useUser()
  const { signOut, getToken } = useClerkAuth()

  const profile: User | null = user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? '',
        full_name: user.fullName,
        avatar_url: user.imageUrl,
        created_at: user.createdAt?.toISOString() ?? new Date().toISOString(),
      }
    : null

  return { profile, isLoaded, isSignedIn, signOut, getToken }
}
