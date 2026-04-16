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
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded) return

    if (!isSignedIn || !user) {
      setSupabaseToken(null)
      setReady(false)
      return
    }

    async function sync() {
      try {
        const token = await getToken({ template: 'supabase' })
        console.log('[Supabase sync] token:', token ? `${token.slice(0, 20)}...` : 'NULL')

        if (!token) {
          console.error('[Supabase sync] getToken returned null — verifica el JWT template "supabase" en Clerk')
          setSyncError('No se pudo obtener el token de autenticación.')
          return
        }

        setSupabaseToken(token)

        const { error: upsertError } = await supabase.from('users').upsert(
          {
            id: user!.id,
            email: user!.primaryEmailAddress?.emailAddress ?? '',
            full_name: user!.fullName,
            avatar_url: user!.imageUrl,
          },
          { onConflict: 'id' }
        )

        if (upsertError) {
          console.error('[Supabase sync] upsert users error:', upsertError.message)
        }

        setReady(true)
      } catch (err) {
        console.error('[Supabase sync] error:', err)
        setSyncError('Error al conectar con la base de datos.')
      }
    }

    sync()

    const interval = setInterval(async () => {
      const token = await getToken({ template: 'supabase' })
      if (token) setSupabaseToken(token)
    }, 55_000)

    return () => clearInterval(interval)
  }, [isLoaded, isSignedIn, user?.id])

  return { ready, isSignedIn, isLoaded, syncError }
}

function AppContent() {
  const { ready, isSignedIn, isLoaded, syncError } = useSupabaseSync()

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
              {syncError ? (
                <div className="min-h-screen bg-cream flex items-center justify-center">
                  <span className="font-body text-red-500 text-sm">{syncError}</span>
                </div>
              ) : ready ? (
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
