import { useMemo } from 'react'
import { useUIStore } from '@/stores/uiStore'
import type { BoardWithLists, CardWithRelations } from '@/types'

export function useFilteredBoard(board: BoardWithLists | null): BoardWithLists | null {
  const searchQuery = useUIStore((s) => s.searchQuery)
  const filterMemberIds = useUIStore((s) => s.filterMemberIds)
  const filterLabelIds = useUIStore((s) => s.filterLabelIds)
  const filterHasDueDate = useUIStore((s) => s.filterHasDueDate)
  const filterOverdue = useUIStore((s) => s.filterOverdue)

  return useMemo(() => {
    if (!board) return null

    const hasSearch = searchQuery.trim().length > 0
    const hasMembers = filterMemberIds.length > 0
    const hasLabels = filterLabelIds.length > 0
    const hasAnyFilter =
      hasSearch || hasMembers || hasLabels || filterHasDueDate || filterOverdue

    if (!hasAnyFilter) return board

    const now = new Date()
    const lowerQuery = searchQuery.trim().toLowerCase()

    function cardPasses(card: CardWithRelations): boolean {
      // Search: title contains query (case-insensitive)
      if (hasSearch) {
        const titleMatch = card.title.toLowerCase().includes(lowerQuery)
        if (!titleMatch) return false
      }

      // Member filter: card must have at least one of the selected members
      if (hasMembers) {
        const assigneeIds = card.assignees.map((a) => a.id)
        const hasMatch = filterMemberIds.some((id) => assigneeIds.includes(id))
        if (!hasMatch) return false
      }

      // Label filter: card must have at least one of the selected labels
      if (hasLabels) {
        const cardLabelIds = card.labels.map((l) => l.id)
        const hasMatch = filterLabelIds.some((id) => cardLabelIds.includes(id))
        if (!hasMatch) return false
      }

      // Due date filter: card must have a due_date
      if (filterHasDueDate) {
        if (!card.due_date) return false
      }

      // Overdue filter: card must have a due_date in the past
      if (filterOverdue) {
        if (!card.due_date) return false
        const dueDate = new Date(card.due_date)
        if (dueDate >= now) return false
      }

      return true
    }

    const filteredLists = board.lists.map((list) => ({
      ...list,
      cards: list.cards.filter(cardPasses),
    }))

    return { ...board, lists: filteredLists }
  }, [
    board,
    searchQuery,
    filterMemberIds,
    filterLabelIds,
    filterHasDueDate,
    filterOverdue,
  ])
}
