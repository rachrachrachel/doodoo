import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { SignedIn, SignedOut, useUser, useAuth as useClerkAuth } from '@clerk/clerk-react'
import { Shell } from '@/components/layout/Shell'
import { BoardsPage } from '@/pages/BoardsPage'
import { BoardPage } from '@/pages/BoardPage'
import { SignInPage } from '@/pages/SignInPage'
import { SignUpPage } from '@/pages/SignUpPage'
import { supabase, setSupabaseToken } from '@/lib/supabase'

// Sincroniza el token de Clerk con el cliente Supabase y upsertea el usuario.
// Retorna `ready` = true sólo cuando el token ya está seteado.
function useSupabaseSync() {
  const { user, isSignedIn, isLoaded } = useUser()
  const { getToken } = useClerkAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !user) {
      setSupabaseToken(null)
      setReady(false)
      return
    }

    async function sync() {
      const token = await getToken({ template: 'supabase' })
      setSupabaseToken(token)

      await supabase.from('users').upsert(
        {
          id: user!.id,
          email: user!.primaryEmailAddress?.emailAddress ?? '',
          full_name: user!.fullName,
          avatar_url: user!.imageUrl,
        },
        { onConflict: 'id' }
      )

      setReady(true)
    }

    sync()

    // Renueva el token cada 55 segundos (expira en 60s)
    const interval = setInterval(async () => {
      const token = await getToken({ template: 'supabase' })
      setSupabaseToken(token)
    }, 55_000)

    return () => clearInterval(interval)
  }, [isLoaded, isSignedIn, user?.id])

  return { ready, isSignedIn, isLoaded }
}

function AppContent() {
  const { ready, isSignedIn, isLoaded } = useSupabaseSync()

  // Muestra nada mientras Clerk carga
  if (!isLoaded) return null

  return (
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
              {/* Espera a que el token esté listo antes de renderizar */}
              {ready ? (
                <Shell>
                  <Routes>
                    <Route path="/" element={<BoardsPage />} />
                    <Route path="/board/:boardId" element={<BoardPage />} />
                  </Routes>
                </Shell>
              ) : (
                <div className="min-h-screen bg-cream flex items-center justify-center">
                  <span className="font-body text-ink/40 text-sm">Cargando...</span>
                </div>
              )}
            </SignedIn>
          </>
        }
      />
    </Routes>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
