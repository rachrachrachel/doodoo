import { useCardStore } from '@/stores/cardStore'

export function useCards(listId: string) {
  const { cardsByList } = useCardStore()
  return { cards: cardsByList[listId] ?? [] }
}
