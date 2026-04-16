import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckSquare, Clock, AlertCircle, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'

interface TodayCard {
  id: string
  title: string
  board_id: string
  board_title: string
  list_title: string
}

export function TodayWidget() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [cards, setCards] = useState<TodayCard[]>([])
  const [loading, setLoading] = useState(false)

  const today = new Date().toISOString().split('T')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'

  useEffect(() => {
    if (!profile) return
    setLoading(true)
    supabase
      .from('cards')
      .select(`id, title, lists ( title, boards ( id, title ) )`)
      .eq('due_date', today)
      .eq('created_by', profile.id)
      .limit(10)
      .then(({ data }) => {
        if (data) {
          setCards(
            data
              .filter((c: any) => c.lists?.boards)
              .map((c: any) => ({
                id: c.id,
                title: c.title,
                board_id: c.lists.boards.id,
                board_title: c.lists.boards.title,
                list_title: c.lists.title,
              }))
          )
        }
        setLoading(false)
      })
  }, [profile?.id, today])

  // Initials fallback
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <div className="fixed bottom-6 right-6" style={{ zIndex: 9999 }}>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0"
              style={{ zIndex: -1 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="absolute bottom-28 right-0 w-72 rounded-2xl overflow-hidden"
              style={{ background: '#fff', boxShadow: '0 12px 40px rgba(0,0,0,0.14)' }}
            >
              {/* Header con gradiente */}
              <div
                className="px-4 pt-5 pb-4 flex items-center justify-between"
                style={{ background: 'linear-gradient(135deg, #1B1B1B 0%, #2d2d2d 100%)' }}
              >
                <div className="flex items-center gap-3">
                  {/* Mini avatar */}
                  <div
                    className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 border-2 border-white/20"
                    style={{ background: '#F2E840' }}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold text-gray-800">{initials}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-white/50 text-xs leading-none mb-0.5">{greeting} 👋</p>
                    <p className="text-white font-semibold text-sm leading-none">
                      {profile?.full_name?.split(' ')[0] ?? 'Tú'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 rounded-lg text-white/30 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Cuerpo */}
              <div className="px-4 py-3">
                <div className="flex items-center gap-1.5 mb-2.5">
                  <Clock size={12} className="text-gray-400" />
                  <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Para hoy</span>
                </div>

                {loading ? (
                  <div className="space-y-2">
                    <div className="h-9 bg-gray-100 rounded-xl animate-pulse" />
                    <div className="h-9 bg-gray-100 rounded-xl animate-pulse" />
                  </div>
                ) : cards.length === 0 ? (
                  <div className="flex items-center gap-2 py-3 text-gray-400">
                    <CheckSquare size={16} />
                    <span className="text-sm">Sin pendientes para hoy 🎉</span>
                  </div>
                ) : (
                  <ul className="space-y-1">
                    {cards.map((card) => (
                      <li key={card.id}>
                        <button
                          onClick={() => { navigate(`/board/${card.board_id}?card=${card.id}`); setOpen(false) }}
                          className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-gray-50 transition-colors group"
                        >
                          <AlertCircle size={13} className="text-yellow-400 mt-0.5 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-sm text-gray-800 truncate font-medium">{card.title}</p>
                            <p className="text-xs text-gray-400 truncate">{card.board_title} · {card.list_title}</p>
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                {cards.length > 0 && (
                  <p className="text-xs text-gray-300 mt-3 text-center">
                    {cards.length} {cards.length === 1 ? 'pendiente' : 'pendientes'} hoy
                  </p>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mascota flotante — nube con carita */}
      <motion.button
        onClick={() => setOpen((v) => !v)}
        animate={{ y: [0, -9, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.08, rotate: [-1, 1, -1] }}
        whileTap={{ scale: 0.9 }}
        className="relative"
        style={{ filter: open ? 'drop-shadow(0 0 6px #1B1B1B)' : 'drop-shadow(0 8px 16px rgba(0,0,0,0.18))' }}
      >
        <svg viewBox="0 0 110 100" width={110} height={100} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#D4B8F0" />
              <stop offset="55%" stopColor="#F0B8D0" />
              <stop offset="100%" stopColor="#F2E840" />
            </linearGradient>
          </defs>

          {/* Cuerpo de la nube — círculos superpuestos */}
          <circle cx="55" cy="36" r="27" fill="url(#cloudGrad)" />
          <circle cx="30" cy="50" r="22" fill="url(#cloudGrad)" />
          <circle cx="80" cy="50" r="22" fill="url(#cloudGrad)" />
          <rect x="10" y="50" width="90" height="38" rx="20" fill="url(#cloudGrad)" />

          {/* Ojos */}
          <circle cx="42" cy="60" r="4.5" fill="#2a2a2a" />
          <circle cx="68" cy="60" r="4.5" fill="#2a2a2a" />

          {/* Brillo en los ojos */}
          <circle cx="44" cy="58" r="1.5" fill="white" />
          <circle cx="70" cy="58" r="1.5" fill="white" />

          {/* Sonrisa */}
          <path
            d="M 44,72 Q 55,82 66,72"
            stroke="#2a2a2a"
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
          />
        </svg>

        {/* Badge de pendientes */}
        {cards.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute top-0 right-0 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: '#1B1B1B', color: '#F2E840' }}
          >
            {cards.length}
          </motion.span>
        )}
      </motion.button>
    </div>
  )
}
