import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence, useMotionValue } from 'framer-motion'
import { CheckSquare, Clock, AlertCircle, X, Pencil } from 'lucide-react'
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
  const [mascotName, setMascotName] = useState(() => localStorage.getItem('doodoo-widget-name') || 'Doodoo')
  const [editingName, setEditingName] = useState(false)
  const nameInputRef = useRef<HTMLInputElement>(null)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!profile) return
    setLoading(true)

    // Fetch cards due today: created by user OR assigned to user
    Promise.all([
      supabase
        .from('cards')
        .select(`id, title, created_by, lists ( title, boards ( id, title ) )`)
        .eq('due_date', today)
        .eq('created_by', profile.id)
        .limit(10),
      supabase
        .from('card_assignees')
        .select(`card_id, cards ( id, title, due_date, created_by, lists ( title, boards ( id, title ) ) )`)
        .eq('user_id', profile.id)
        .eq('cards.due_date', today)
        .limit(10),
    ]).then(([createdRes, assignedRes]) => {
      const seen = new Set<string>()
      const result: TodayCard[] = []

      const addCard = (c: any) => {
        if (!c || !c.lists?.boards || seen.has(c.id)) return
        seen.add(c.id)
        result.push({
          id: c.id,
          title: c.title,
          board_id: c.lists.boards.id,
          board_title: c.lists.boards.title,
          list_title: c.lists.title,
        })
      }

      ;(createdRes.data ?? []).forEach(addCard)
      ;(assignedRes.data ?? [])
        .map((row: any) => row.cards)
        .filter((c: any) => c?.due_date === today)
        .forEach(addCard)

      setCards(result)
      setLoading(false)
    })
  }, [profile?.id, today])

  // Initials fallback
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const isDragging = useRef(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('doodoo-widget-pos')
      if (saved) {
        const { x, y } = JSON.parse(saved)
        dragX.set(x)
        dragY.set(y)
      }
    } catch {}
  }, [])

  const handleMascotClick = () => {
    if (isDragging.current) return
    setOpen((v) => !v)
  }

  const handleNameSave = (val: string) => {
    const trimmed = val.trim() || 'Doodoo'
    setMascotName(trimmed)
    localStorage.setItem('doodoo-widget-name', trimmed)
    setEditingName(false)
  }

  useEffect(() => {
    if (editingName) nameInputRef.current?.focus()
  }, [editingName])

  return (
    <motion.div
      className="fixed bottom-6 right-6 cursor-grab active:cursor-grabbing"
      style={{ x: dragX, y: dragY, zIndex: 9999 }}
      drag
      dragMomentum={false}
      dragElastic={0}
      onDragStart={() => { isDragging.current = true }}
      onDragEnd={() => {
        localStorage.setItem('doodoo-widget-pos', JSON.stringify({ x: dragX.get(), y: dragY.get() }))
        setTimeout(() => { isDragging.current = false }, 50)
      }}
    >

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
                    <p className="text-white/50 text-xs leading-none mb-0.5">Hola 👋</p>
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

      {/* Mascota flotante — estilo sticker ilustración */}
      <div className="flex flex-col items-center -gap-2">
      <motion.button
        onClick={handleMascotClick}
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.88 }}
        className="relative"
      >
        <svg viewBox="0 0 110 100" width={116} height={106} xmlns="http://www.w3.org/2000/svg">
          <defs>
            <filter id="shadow" x="-20%" y="-10%" width="140%" height="150%">
              <feDropShadow dx="0" dy="5" stdDeviation="5" floodColor="#1B1B1B" floodOpacity="0.18"/>
            </filter>
          </defs>

          <g filter="url(#shadow)">
            <g>
              {/* Cuerpo nube — path con 3 bumps, color plano */}
              <path
                d="M 15 84 C 3 84 2 72 8 66 C 0 60 0 44 14 38 C 9 20 28 12 44 22 C 46 12 64 10 68 22 C 72 12 88 18 92 32 C 104 38 106 56 96 66 C 106 72 104 86 90 84 Z"
                fill="#F2E840"
                stroke="#1B1B1B"
                strokeWidth="3"
                strokeLinejoin="round"
                strokeLinecap="round"
              />

              {/* Planta en la cabeza — sobre el bump central (~x55, y14) */}
              {/* Tallo */}
              <path
                d="M 55 17 C 54 11 56 6 57 2"
                stroke="#1B1B1B"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
              />
              {/* Hoja izquierda */}
              <path
                d="M 55 13 C 47 9 43 2 50 1 C 57 3 57 10 55 13 Z"
                fill="#78D89A"
                stroke="#1B1B1B"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />
              {/* Hoja derecha */}
              <path
                d="M 56 10 C 64 6 69 1 63 2 C 57 5 55 9 56 10 Z"
                fill="#78D89A"
                stroke="#1B1B1B"
                strokeWidth="2.2"
                strokeLinejoin="round"
              />

              {/* Mejillas rosas */}
              <ellipse cx="34" cy="69" rx="9" ry="6" fill="#F0B8D0" opacity="0.9"/>
              <ellipse cx="76" cy="69" rx="9" ry="6" fill="#F0B8D0" opacity="0.9"/>

              {/* Ojo izquierdo */}
              <circle cx="43" cy="60" r="3.5" fill="#1B1B1B"/>

              {/* Ojo derecho */}
              <circle cx="67" cy="60" r="3.5" fill="#1B1B1B"/>

              {/* Sonrisa */}
              <path
                d="M 42 71 Q 55 83 68 71"
                stroke="#1B1B1B"
                strokeWidth="2.8"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          </g>
        </svg>

        {/* Badge de pendientes */}
        {cards.length > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 20 }}
            className="absolute top-1 right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center"
            style={{ background: '#1B1B1B', color: '#F2E840' }}
          >
            {cards.length}
          </motion.span>
        )}
      </motion.button>

      {/* Nombre editable de la mascota */}
      <div className="-mt-3 relative z-10 flex justify-center">
        {editingName ? (
          <input
            ref={nameInputRef}
            defaultValue={mascotName}
            onBlur={(e) => handleNameSave(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') handleNameSave(e.currentTarget.value)
              if (e.key === 'Escape') setEditingName(false)
            }}
            onClick={(e) => e.stopPropagation()}
            maxLength={16}
            className="text-center text-[10px] font-bold outline-none rounded-full px-2 py-0.5 cursor-text"
            style={{ background: '#1B1B1B', color: '#F2E840', width: '64px' }}
          />
        ) : (
          <button
            onClick={(e) => {
              e.stopPropagation()
              if (!isDragging.current) setEditingName(true)
            }}
            className="group flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-opacity hover:opacity-70"
            style={{ background: '#1B1B1B', color: '#F2E840' }}
          >
            {mascotName}
            <Pencil size={8} className="opacity-0 group-hover:opacity-50 transition-opacity" />
          </button>
        )}
      </div>
      </div>
    </motion.div>
  )
}
