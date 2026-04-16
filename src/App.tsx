import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { Shell } from '@/components/layout/Shell'
import { BoardsPage } from '@/pages/BoardsPage'
import { BoardPage } from '@/pages/BoardPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { supabase, setSupabaseToken } from '@/lib/supabase'

// Sincroniza el token de Clerk con el cliente Supabase y upsertea el usuario
function SupabaseAuthSync() {
  const { user, isSignedIn } = useUser()
  const { getToken } = useClerkAuth()

  useEffect(() => {
    if (!isSignedIn || !user) {
      setSupabaseToken(null)
      return
    }

    async function sync() {
      // Obtiene el JWT de Clerk firmado con el secret de Supabase
      const token = await getToken({ template: 'supabase' })
      setSupabaseToken(token)

      // Upsert del usuario en Supabase
      await supabase.from('users').upsert(
        {
          id: user!.id,
          email: user!.primaryEmailAddress?.emailAddress ?? '',
          full_name: user!.fullName,
          avatar_url: user!.imageUrl,
        },
        { onConflict: 'id' }
      )
    }

    sync()

    // Renueva el token cada 55 segundos (expira en 60s)
    const interval = setInterval(async () => {
      const token = await getToken({ template: 'supabase' })
      setSupabaseToken(token)
    }, 55_000)

    return () => clearInterval(interval)
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
