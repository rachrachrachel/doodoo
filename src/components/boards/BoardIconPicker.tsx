import { useState, useRef, useEffect } from 'react'
import { Smile } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'

// ── Sticker-style SVG icons matching the Doodoo mascot aesthetic ──────────────

function IconStar({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sh-star" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1B1B1B" floodOpacity="0.18"/>
        </filter>
      </defs>
      <polygon
        points="20,4 24.9,14.9 37,16.4 28,25.1 30.2,37 20,31.3 9.8,37 12,25.1 3,16.4 15.1,14.9"
        fill="#F2E840" stroke="#1B1B1B" strokeWidth="2.5"
        strokeLinejoin="round" filter="url(#sh-star)"
      />
    </svg>
  )
}

function IconLaptop({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sh-laptop" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1B1B1B" floodOpacity="0.18"/>
        </filter>
      </defs>
      <g filter="url(#sh-laptop)">
        {/* lid */}
        <rect x="8" y="7" width="24" height="16" rx="2.5"
          fill="#F2E840" stroke="#1B1B1B" strokeWidth="2.5" strokeLinejoin="round"/>
        {/* screen */}
        <rect x="11" y="10" width="18" height="10" rx="1.5" fill="#1B1B1B"/>
        {/* cursor blink */}
        <rect x="13" y="12" width="2" height="2.5" rx="0.5" fill="#F2E840" opacity="0.7"/>
        {/* base */}
        <path d="M4 23 L8 23 L8 27 L32 27 L32 23 L36 23 L36 26 C36 28 34 30 32 30 L8 30 C6 30 4 28 4 26 Z"
          fill="#F2E840" stroke="#1B1B1B" strokeWidth="2.5" strokeLinejoin="round"/>
        {/* trackpad */}
        <rect x="16" y="24" width="8" height="4" rx="1.5" fill="none" stroke="#1B1B1B" strokeWidth="1.8"/>
      </g>
    </svg>
  )
}

function IconBolt({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sh-bolt" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1B1B1B" floodOpacity="0.18"/>
        </filter>
      </defs>
      <polygon
        points="24,3 13,21 20,21 16,37 27,19 20,19"
        fill="#F2E840" stroke="#1B1B1B" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" filter="url(#sh-bolt)"
      />
    </svg>
  )
}

function IconSprout({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sh-sprout" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1B1B1B" floodOpacity="0.18"/>
        </filter>
      </defs>
      <g filter="url(#sh-sprout)">
        {/* pot */}
        <path d="M13 28 L15 36 L25 36 L27 28 Z" fill="#F2E840" stroke="#1B1B1B" strokeWidth="2.5" strokeLinejoin="round"/>
        <rect x="11" y="25" width="18" height="4" rx="2" fill="#F2E840" stroke="#1B1B1B" strokeWidth="2.5"/>
        {/* stem */}
        <path d="M20 25 L20 14" stroke="#1B1B1B" strokeWidth="2.5" strokeLinecap="round"/>
        {/* leaf left */}
        <path d="M20 20 C12 16 9 8 16 8 C21 8 22 16 20 20 Z"
          fill="#78D89A" stroke="#1B1B1B" strokeWidth="2.2" strokeLinejoin="round"/>
        {/* leaf right */}
        <path d="M20 16 C28 12 31 4 24 4 C19 4 18 12 20 16 Z"
          fill="#78D89A" stroke="#1B1B1B" strokeWidth="2.2" strokeLinejoin="round"/>
      </g>
    </svg>
  )
}

function IconGem({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sh-gem" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1B1B1B" floodOpacity="0.18"/>
        </filter>
      </defs>
      <g filter="url(#sh-gem)">
        <polygon points="20,35 4,16 11,5 29,5 36,16"
          fill="#F2E840" stroke="#1B1B1B" strokeWidth="2.5" strokeLinejoin="round"/>
        <polyline points="4,16 20,35 36,16"
          fill="none" stroke="#1B1B1B" strokeWidth="2" strokeLinejoin="round"/>
        <polyline points="11,5 14,16 20,5"
          fill="none" stroke="#1B1B1B" strokeWidth="2" strokeLinejoin="round"/>
        <polyline points="29,5 26,16 20,5"
          fill="none" stroke="#1B1B1B" strokeWidth="2" strokeLinejoin="round"/>
        <line x1="14" y1="16" x2="4" y2="16" stroke="#1B1B1B" strokeWidth="2"/>
        <line x1="26" y1="16" x2="36" y2="16" stroke="#1B1B1B" strokeWidth="2"/>
      </g>
    </svg>
  )
}

function IconTarget({ size = 36 }: { size?: number }) {
  return (
    <svg viewBox="0 0 40 40" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <filter id="sh-target" x="-30%" y="-20%" width="160%" height="160%">
          <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#1B1B1B" floodOpacity="0.18"/>
        </filter>
      </defs>
      <g filter="url(#sh-target)">
        <circle cx="20" cy="20" r="16" fill="#F2E840" stroke="#1B1B1B" strokeWidth="2.5"/>
        <circle cx="20" cy="20" r="10" fill="#fff" stroke="#1B1B1B" strokeWidth="2.5"/>
        <circle cx="20" cy="20" r="4.5" fill="#1B1B1B"/>
      </g>
    </svg>
  )
}

export type BoardIconKey = 'star' | 'laptop' | 'bolt' | 'sprout' | 'gem' | 'target'

const ICONS: { key: BoardIconKey; label: string; Component: typeof IconStar }[] = [
  { key: 'star',    label: 'Estrella', Component: IconStar },
  { key: 'laptop',  label: 'Compu',    Component: IconLaptop },
  { key: 'bolt',    label: 'Rayo',     Component: IconBolt },
  { key: 'sprout',  label: 'Planta',   Component: IconSprout },
  { key: 'gem',     label: 'Gema',     Component: IconGem },
  { key: 'target',  label: 'Objetivo', Component: IconTarget },
]

export function BoardIconDisplay({ iconKey, size = 36 }: { iconKey: string; size?: number }) {
  const found = ICONS.find((i) => i.key === iconKey)
  if (!found) return null
  return <found.Component size={size} />
}

interface BoardIconPickerProps {
  icon: string | null
  onChange: (icon: string | null) => void
}

export function BoardIconPicker({ icon, onChange }: BoardIconPickerProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleSelect = (key: string) => {
    onChange(key)
    setOpen(false)
  }

  const handleRemove = () => {
    onChange(null)
    setOpen(false)
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        title="Cambiar icono"
        className={cn(
          'w-11 h-11 rounded-xl flex items-center justify-center',
          'hover:bg-ink/5 transition-colors duration-hover',
          'border-2 border-dashed border-ink/15 hover:border-ink/30'
        )}
      >
        {icon ? (
          <BoardIconDisplay iconKey={icon} size={32} />
        ) : (
          <Smile size={18} className="text-ink/30" />
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={cn(
              'absolute left-0 top-full mt-1 z-50',
              'bg-surface rounded-card shadow-card-hover',
              'border border-ink/5 p-3'
            )}
          >
            <div className="flex items-center gap-2">
              {ICONS.map(({ key, label, Component }) => (
                <button
                  key={key}
                  type="button"
                  title={label}
                  onClick={() => handleSelect(key)}
                  className={cn(
                    'w-12 h-12 flex items-center justify-center rounded-xl',
                    'hover:bg-ink/5 transition-colors duration-[80ms]',
                    icon === key && 'bg-accent-yellow/20 ring-2 ring-accent-yellow/40'
                  )}
                >
                  <Component size={34} />
                </button>
              ))}
            </div>
            {icon && (
              <button
                type="button"
                onClick={handleRemove}
                className="mt-2 w-full text-center font-body text-xs text-ink/40 hover:text-ink/70 py-1 rounded-lg hover:bg-ink/5 transition-colors"
              >
                Quitar icono
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
