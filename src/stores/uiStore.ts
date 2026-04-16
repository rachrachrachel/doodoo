import { create } from 'zustand'

interface UIState {
  // List collapse state
  collapsedLists: Set<string>
  activeCardId: string | null

  toggleListCollapse: (listId: string) => void
  setActiveCard: (cardId: string | null) => void

  // Filters
  searchQuery: string
  filterMemberIds: string[]
  filterLabelIds: string[]
  filterHasDueDate: boolean
  filterOverdue: boolean

  setSearch: (query: string) => void
  toggleMemberFilter: (userId: string) => void
  toggleLabelFilter: (labelId: string) => void
  setDueDateFilter: (hasDueDate: boolean) => void
  setOverdueFilter: (overdue: boolean) => void
  clearFilters: () => void
}

export const useUIStore = create<UIState>((set) => ({
  collapsedLists: new Set(),
  activeCardId: null,

  toggleListCollapse: (listId) =>
    set((s) => {
      const next = new Set(s.collapsedLists)
      next.has(listId) ? next.delete(listId) : next.add(listId)
      return { collapsedLists: next }
    }),

  setActiveCard: (cardId) => set({ activeCardId: cardId }),

  // Filter state
  searchQuery: '',
  filterMemberIds: [],
  filterLabelIds: [],
  filterHasDueDate: false,
  filterOverdue: false,

  setSearch: (query) => set({ searchQuery: query }),

  toggleMemberFilter: (userId) =>
    set((s) => {
      const ids = s.filterMemberIds.includes(userId)
        ? s.filterMemberIds.filter((id) => id !== userId)
        : [...s.filterMemberIds, userId]
      return { filterMemberIds: ids }
    }),

  toggleLabelFilter: (labelId) =>
    set((s) => {
      const ids = s.filterLabelIds.includes(labelId)
        ? s.filterLabelIds.filter((id) => id !== labelId)
        : [...s.filterLabelIds, labelId]
      return { filterLabelIds: ids }
    }),

  setDueDateFilter: (hasDueDate) => set({ filterHasDueDate: hasDueDate }),

  setOverdueFilter: (overdue) => set({ filterOverdue: overdue }),

  clearFilters: () =>
    set({
      searchQuery: '',
      filterMemberIds: [],
      filterLabelIds: [],
      filterHasDueDate: false,
      filterOverdue: false,
    }),
}))
