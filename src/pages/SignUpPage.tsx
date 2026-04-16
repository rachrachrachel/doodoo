import { SignUp } from '@clerk/clerk-react'

export function SignUpPage() {
  return (
    <div className="min-h-screen bg-cream flex items-center justify-center p-6 relative overflow-hidden">

      {/* Blobs decorativos */}
      <div
        className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-60 blur-3xl pointer-events-none"
        style={{ backgroundColor: '#F2E840' }}
      />
      <div
        className="absolute -bottom-32 -left-20 w-[28rem] h-[28rem] rounded-full opacity-50 blur-3xl pointer-events-none"
        style={{ backgroundColor: '#D4B8F0' }}
      />
      <div
        className="absolute top-1/2 -left-40 w-80 h-80 rounded-full opacity-40 blur-3xl pointer-events-none"
        style={{ backgroundColor: '#F0B8D0' }}
      />

      {/* Tarjetas flotantes decorativas — sólo desktop */}
      <div className="hidden lg:block absolute top-16 right-16 rotate-[8deg]">
        <div className="bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-3 w-52">
          <div className="w-7 h-7 rounded-lg bg-accent-yellow flex items-center justify-center text-ink font-display text-xs flex-shrink-0">
            ✓
          </div>
          <span className="font-body text-xs text-ink/70">Diseño del landing</span>
        </div>
      </div>
      <div className="hidden lg:block absolute bottom-24 right-24 rotate-[-6deg]">
        <div className="bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-3 w-52">
          <div className="w-7 h-7 rounded-lg bg-[#D4B8F0] flex items-center justify-center text-ink font-display text-xs flex-shrink-0">
            🔥
          </div>
          <span className="font-body text-xs text-ink/70">Sprint en progreso</span>
        </div>
      </div>
      <div className="hidden lg:block absolute top-20 left-16 rotate-[-5deg]">
        <div className="bg-white rounded-2xl shadow-card px-4 py-3 flex items-center gap-3 w-52">
          <div className="w-7 h-7 rounded-lg bg-[#F0B8D0] flex items-center justify-center text-ink font-display text-xs flex-shrink-0">
            →
          </div>
          <span className="font-body text-xs text-ink/70">En revisión</span>
        </div>
      </div>

      {/* Contenedor principal centrado */}
      <div className="relative z-10 flex flex-col items-center gap-6 w-full max-w-sm">

        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 mb-1">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: '#1B1B1B' }}
            >
              <span className="font-display text-base text-accent-yellow">D</span>
            </div>
            <h1 className="font-display text-3xl text-ink">DooDoo</h1>
          </div>
          <p className="font-body text-sm text-ink/40">
            Crea tu cuenta y empieza a organizar.
          </p>
        </div>

        {/* Clerk SignUp */}
        <SignUp
          routing="hash"
          afterSignUpUrl="/"
          signInUrl="/sign-in"
        />

      </div>
    </div>
  )
}
