import { useRef, useEffect, useState } from 'react'
import { Search, Users, Tags, Calendar, Clock, X, ChevronDown, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/utils/cn'
import { useUIStore } from '@/stores/uiStore'
import { Avatar } from '@/components/ui/Avatar'
import type { BoardWithLists } from '@/types'

interface FilterBarProps {
  board: BoardWithLists
}

// Reusable dropdown wrapper
function useDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return { open, setOpen, ref }
}

const dropdownVariants = {
  initial: { opacity: 0, y: -6, scale: 0.97 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -6, scale: 0.97 },
}

export function FilterBar({ board }: FilterBarProps) {
  const searchQuery = useUIStore((s) => s.searchQuery)
  const filterMemberIds = useUIStore((s) => s.filterMemberIds)
  const filterLabelIds = useUIStore((s) => s.filterLabelIds)
  const filterHasDueDate = useUIStore((s) => s.filterHasDueDate)
  const filterOverdue = useUIStore((s) => s.filterOverdue)
  const setSearch = useUIStore((s) => s.setSearch)
  const toggleMemberFilter = useUIStore((s) => s.toggleMemberFilter)
  const toggleLabelFilter = useUIStore((s) => s.toggleLabelFilter)
  const setDueDateFilter = useUIStore((s) => s.setDueDateFilter)
  const setOverdueFilter = useUIStore((s) => s.setOverdueFilter)
  const clearFilters = useUIStore((s) => s.clearFilters)

  const membersDropdown = useDropdown()
  const labelsDropdown = useDropdown()

  const activeFilterCount =
    (searchQuery.trim().length > 0 ? 1 : 0) +
    filterMemberIds.length +
    filterLabelIds.length +
    (filterHasDueDate ? 1 : 0) +
    (filterOverdue ? 1 : 0)

  const hasActiveFilters = activeFilterCount > 0

  return (
    <div className="flex items-center gap-2 flex-wrap mt-3">
      {/* Search input */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cards..."
          className={cn(
            'pl-8 pr-3 py-1.5 rounded-xl font-body text-sm',
            'bg-surface border border-ink/10',
            'text-ink placeholder:text-ink/35',
            'outline-none focus:border-accent-yellow/60 focus:ring-1 focus:ring-accent-yellow/30',
            'transition-all duration-hover w-48'
          )}
        />
      </div>

      {/* Members dropdown */}
      {board.members && board.members.length > 0 && (
        <div className="relative" ref={membersDropdown.ref}>
          <button
            type="button"
            onClick={() => membersDropdown.setOpen((prev) => !prev)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-sm',
              'border transition-all duration-hover',
              filterMemberIds.length > 0
                ? 'bg-accent-yellow border-accent-yellow text-ink font-medium'
                : 'bg-surface border-ink/10 text-ink/70 hover:text-ink hover:border-ink/25'
            )}
          >
            <Users size={13} />
            Miembros
            {filterMemberIds.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-ink/15 text-xs font-medium">
                {filterMemberIds.length}
              </span>
            )}
            <ChevronDown
              size={12}
              className={cn(
                'transition-transform duration-hover',
                membersDropdown.open && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {membersDropdown.open && (
              <motion.div
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute left-0 top-full mt-1 z-50',
                  'w-56 bg-surface rounded-card shadow-card-hover',
                  'border border-ink/5 overflow-hidden'
                )}
              >
                <p className="px-3 pt-2.5 pb-1 font-body text-xs text-ink/40 uppercase tracking-wide">
                  Filtrar por miembro
                </p>
                <ul className="py-1">
                  {board.members.map((member) => {
                    const isActive = filterMemberIds.includes(member.id)
                    return (
                      <li key={member.id}>
                        <button
                          type="button"
                          onClick={() => toggleMemberFilter(member.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2',
                            'hover:bg-cream transition-colors duration-hover',
                            isActive && 'bg-accent-yellow/10'
                          )}
                        >
                          <Avatar
                            src={member.avatar_url}
                            name={member.full_name}
                            size="sm"
                            className={cn(
                              'transition-all duration-hover',
                              isActive && 'ring-2 ring-accent-yellow ring-offset-1'
                            )}
                          />
                          <span className="flex-1 font-body text-sm text-ink truncate text-left">
                            {member.full_name ?? member.email}
                          </span>
                          {isActive && (
                            <Check size={13} className="text-ink/60 flex-shrink-0" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Labels dropdown */}
      {board.boardLabels && board.boardLabels.length > 0 && (
        <div className="relative" ref={labelsDropdown.ref}>
          <button
            type="button"
            onClick={() => labelsDropdown.setOpen((prev) => !prev)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-sm',
              'border transition-all duration-hover',
              filterLabelIds.length > 0
                ? 'bg-accent-yellow border-accent-yellow text-ink font-medium'
                : 'bg-surface border-ink/10 text-ink/70 hover:text-ink hover:border-ink/25'
            )}
          >
            <Tags size={13} />
            Etiquetas
            {filterLabelIds.length > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-ink/15 text-xs font-medium">
                {filterLabelIds.length}
              </span>
            )}
            <ChevronDown
              size={12}
              className={cn(
                'transition-transform duration-hover',
                labelsDropdown.open && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {labelsDropdown.open && (
              <motion.div
                variants={dropdownVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={{ duration: 0.15 }}
                className={cn(
                  'absolute left-0 top-full mt-1 z-50',
                  'w-56 bg-surface rounded-card shadow-card-hover',
                  'border border-ink/5 overflow-hidden'
                )}
              >
                <p className="px-3 pt-2.5 pb-1 font-body text-xs text-ink/40 uppercase tracking-wide">
                  Filtrar por etiqueta
                </p>
                <ul className="py-1">
                  {board.boardLabels.map((label) => {
                    const isActive = filterLabelIds.includes(label.id)
                    return (
                      <li key={label.id}>
                        <button
                          type="button"
                          onClick={() => toggleLabelFilter(label.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-3 py-2',
                            'hover:bg-cream transition-colors duration-hover',
                            isActive && 'bg-accent-yellow/10'
                          )}
                        >
                          <span
                            className="w-4 h-4 rounded-md flex-shrink-0"
                            style={{ backgroundColor: label.color }}
                          />
                          <span
                            className="flex-1 font-body text-sm truncate text-left"
                            style={{ color: label.color }}
                          >
                            {label.name}
                          </span>
                          {isActive && (
                            <Check size={13} className="text-ink/60 flex-shrink-0" />
                          )}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Overdue toggle */}
      <button
        type="button"
        onClick={() => setOverdueFilter(!filterOverdue)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-sm',
          'border transition-all duration-hover',
          filterOverdue
            ? 'bg-accent-rose border-accent-rose text-ink font-medium'
            : 'bg-surface border-ink/10 text-ink/70 hover:text-ink hover:border-ink/25'
        )}
      >
        <Clock size={13} />
        Vencidas
      </button>

      {/* Has due date toggle */}
      <button
        type="button"
        onClick={() => setDueDateFilter(!filterHasDueDate)}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-body text-sm',
          'border transition-all duration-hover',
          filterHasDueDate
            ? 'bg-accent-lila border-accent-lila text-ink font-medium'
            : 'bg-surface border-ink/10 text-ink/70 hover:text-ink hover:border-ink/25'
        )}
      >
        <Calendar size={13} />
        Con fecha
      </button>

      {/* Active filters badge + clear button */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85 }}
            transition={{ duration: 0.12 }}
            className="flex items-center gap-1.5"
          >
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-accent-yellow font-body text-xs font-medium text-ink">
              {activeFilterCount} {activeFilterCount === 1 ? 'filtro' : 'filtros'}
            </span>
            <button
              type="button"
              onClick={clearFilters}
              className={cn(
                'flex items-center gap-1 px-2.5 py-1.5 rounded-xl font-body text-sm',
                'text-ink/50 hover:text-ink hover:bg-ink/5',
                'transition-all duration-hover'
              )}
            >
              <X size={13} />
              Limpiar
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
