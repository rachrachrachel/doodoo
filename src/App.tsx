import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, useUser } from '@clerk/clerk-react'
import { Shell } from '@/components/layout/Shell'
import { BoardsPage } from '@/pages/BoardsPage'
import { BoardPage } from '@/pages/BoardPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { supabase } from '@/lib/supabase'

// Upsertea el usuario en Supabase cuando inicia sesión con Clerk
function SupabaseAuthSync() {
  const { user, isSignedIn } = useUser()

  useEffect(() => {
    if (!isSignedIn || !user) return

    supabase.from('users').upsert(
      {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? '',
        full_name: user.fullName,
        avatar_url: user.imageUrl,
      },
      { onConflict: 'id' }
    )
  }, [isSignedIn, user?.id])

  return null
}

export function App() {
  return (
    <BrowserRouter>
      <SupabaseAuthSync />
      <Routes>
        <Route
          path="/sign-in"
          element={
            <SignedOut>
              <SignInPage />
            </SignedOut>
          }
        />
        <Route
          path="/sign-up"
          element={
            <SignedOut>
              <SignUpPage />
            </SignedOut>
          }
        />
        <Route
          path="/*"
          element={
            <>
              <SignedOut>
                <SignInPage />
              </SignedOut>
              <SignedIn>
                <Shell>
                  <Routes>
                    <Route path="/" element={<BoardsPage />} />
                    <Route path="/board/:boardId" element={<BoardPage />} />
                  </Routes>
                </Shell>
              </SignedIn>
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
