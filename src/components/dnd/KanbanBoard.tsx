import { useState, useCallback, useMemo, useRef } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core'
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useCardStore } from '@/stores/cardStore'
import { useListStore } from '@/stores/listStore'
import { useBoardStore } from '@/stores/boardStore'
import { useAuth } from '@/hooks/useAuth'
import { logCardMoved } from '@/utils/activityLogger'
import { SortableColumn } from '@/components/dnd/SortableColumn'
import { KanbanCard } from '@/components/cards/KanbanCard'
import { AddListButton } from '@/components/lists/AddListButton'
import type { BoardWithLists, CardWithRelations, ListWithCards } from '@/types'

interface KanbanBoardProps {
  board: BoardWithLists
}

type ActiveDragItem =
  | { type: 'card'; card: CardWithRelations }
  | { type: 'column'; list: ListWithCards }
  | null

export function KanbanBoard({ board }: KanbanBoardProps) {
  const { moveCard } = useCardStore()
  const { reorderLists } = useListStore()
  const { fetchBoard } = useBoardStore()
  const { profile } = useAuth()

  const [activeItem, setActiveItem] = useState<ActiveDragItem>(null)

  // Local state for optimistic reordering during drag
  const [localLists, setLocalLists] = useState<ListWithCards[] | null>(null)

  // Track the original list of a card being dragged (before any cross-column moves)
  const originalListIdRef = useRef<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(KeyboardSensor)
  )

  // Use localLists when actively dragging, otherwise use board data
  const sortedLists = useMemo(() => {
    const lists = localLists ?? board.lists
    return [...lists].sort((a, b) => a.position - b.position)
  }, [board.lists, localLists])

  const columnIds = useMemo(
    () => sortedLists.map((l) => l.id),
    [sortedLists]
  )

  // Determine if an ID belongs to a column (either sortable column or droppable zone)
  const isColumnId = useCallback(
    (id: UniqueIdentifier): boolean => {
      const idStr = String(id)
      return sortedLists.some(
        (list) => list.id === id || `column-droppable-${list.id}` === idStr
      )
    },
    [sortedLists]
  )

  // Extract the actual list ID from either a column ID or a column-droppable ID
  const resolveListId = useCallback(
    (id: UniqueIdentifier): string | undefined => {
      const idStr = String(id)
      const direct = sortedLists.find((list) => list.id === id)
      if (direct) return direct.id
      const prefix = 'column-droppable-'
      if (idStr.startsWith(prefix)) {
        const listId = idStr.slice(prefix.length)
        const found = sortedLists.find((list) => list.id === listId)
        return found?.id
      }
      return undefined
    },
    [sortedLists]
  )

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event
      const activeData = active.data.current

      if (activeData?.type === 'card') {
        setActiveItem({ type: 'card', card: activeData.card })
        originalListIdRef.current = activeData.listId
        // Initialize localLists so we can do optimistic cross-column moves
        setLocalLists(
          [...board.lists].sort((a, b) => a.position - b.position)
        )
      } else if (activeData?.type === 'column') {
        setActiveItem({ type: 'column', list: activeData.list })
        setLocalLists(
          [...board.lists].sort((a, b) => a.position - b.position)
        )
      }
    },
    [board.lists]
  )

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event
      if (!over || !localLists) return

      const activeData = active.data.current
      if (activeData?.type !== 'card') return

      const activeCardId = active.id
      const overId = over.id

      // Find the source list (in local state)
      const sourceList = localLists.find((list) =>
        list.cards.some((c) => c.id === activeCardId)
      )
      if (!sourceList) return

      // Determine the destination list
      let destList: ListWithCards | undefined

      if (isColumnId(overId)) {
        // Dropped over a column directly - resolve the actual list ID
        const resolvedId = resolveListId(overId)
        destList = resolvedId ? localLists.find((l) => l.id === resolvedId) : undefined
      } else {
        // Dropped over another card - find which list that card belongs to
        destList = localLists.find((list) =>
          list.cards.some((c) => c.id === overId)
        )
      }

      if (!destList || sourceList.id === destList.id) return

      // Move card from source to destination optimistically in local state
      setLocalLists((prev) => {
        if (!prev) return prev
        const newLists = prev.map((list) => ({ ...list, cards: [...list.cards] }))

        const srcListIdx = newLists.findIndex((l) => l.id === sourceList.id)
        const dstListIdx = newLists.findIndex((l) => l.id === destList!.id)
        if (srcListIdx === -1 || dstListIdx === -1) return prev

        // Remove card from source
        const cardIdx = newLists[srcListIdx].cards.findIndex(
          (c) => c.id === activeCardId
        )
        if (cardIdx === -1) return prev
        const [movedCard] = newLists[srcListIdx].cards.splice(cardIdx, 1)

        // Update the card's list_id
        const updatedCard = { ...movedCard, list_id: destList!.id }

        // Insert into destination
        if (isColumnId(overId)) {
          // Dropped on empty column or column itself - add to end
          newLists[dstListIdx].cards.push(updatedCard)
        } else {
          // Insert at the position of the card we're hovering over
          const overIdx = newLists[dstListIdx].cards.findIndex(
            (c) => c.id === overId
          )
          if (overIdx === -1) {
            newLists[dstListIdx].cards.push(updatedCard)
          } else {
            newLists[dstListIdx].cards.splice(overIdx, 0, updatedCard)
          }
        }

        return newLists
      })
    },
    [localLists, isColumnId, resolveListId]
  )

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      const activeData = active.data.current

      if (!over) {
        setActiveItem(null)
        setLocalLists(null)
        originalListIdRef.current = null
        return
      }

      // ---- Column reorder ----
      if (activeData?.type === 'column') {
        if (active.id !== over.id && isColumnId(over.id)) {
          const oldIndex = sortedLists.findIndex((l) => l.id === active.id)
          const newIndex = sortedLists.findIndex((l) => l.id === over.id)

          if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
            const reordered = arrayMove(sortedLists, oldIndex, newIndex)
            const updates = reordered.map((list, idx) => ({
              id: list.id,
              position: idx,
            }))
            // Reset state before async call
            setActiveItem(null)
            setLocalLists(null)
            await reorderLists(board.id, updates)
          } else {
            setActiveItem(null)
            setLocalLists(null)
          }
        } else {
          setActiveItem(null)
          setLocalLists(null)
        }
        originalListIdRef.current = null
        return
      }

      // ---- Card reorder / move ----
      if (activeData?.type === 'card' && localLists) {
        const activeCardId = active.id as string
        const fromListId = originalListIdRef.current

        // Find where the card currently is in local state
        const currentList = localLists.find((list) =>
          list.cards.some((c) => c.id === activeCardId)
        )

        if (currentList && fromListId) {
          // Use array order (reflects optimistic drag state), not position field
          const cardsInOrder = currentList.cards
          const newPosition = cardsInOrder.findIndex((c) => c.id === activeCardId)

          // Handle within-same-list reorder
          if (currentList.id === fromListId) {
            // Check if it's over another card in the same list
            if (over.id !== active.id && !isColumnId(over.id)) {
              const overIdx = cardsInOrder.findIndex((c) => c.id === over.id)
              const activeIdx = cardsInOrder.findIndex(
                (c) => c.id === activeCardId
              )

              if (
                overIdx !== -1 &&
                activeIdx !== -1 &&
                overIdx !== activeIdx
              ) {
                // Persist: move to same list at new position
                setActiveItem(null)
                setLocalLists(null)
                originalListIdRef.current = null
                await moveCard(activeCardId, fromListId, fromListId, overIdx)
                await fetchBoard(board.id)
                return
              }
            }

            // Dropped in same position - no-op
            setActiveItem(null)
            setLocalLists(null)
            originalListIdRef.current = null
            return
          }

          // Cross-column move
          const finalPosition = newPosition >= 0 ? newPosition : 0
          // Capture data needed for logging before clearing state
          const movedCard = activeItem?.type === 'card' ? activeItem.card : null
          const fromListName =
            sortedLists.find((l) => l.id === fromListId)?.title ?? fromListId
          const toListName = currentList.title
          setActiveItem(null)
          setLocalLists(null)
          originalListIdRef.current = null
          await moveCard(
            activeCardId,
            fromListId,
            currentList.id,
            finalPosition
          )
          if (profile && movedCard) {
            logCardMoved(
              board.id,
              profile.id,
              movedCard.title,
              fromListName,
              toListName
            )
          }
          await fetchBoard(board.id)
          return
        }
      }

      setActiveItem(null)
      setLocalLists(null)
      originalListIdRef.current = null
    },
    [
      board.id,
      sortedLists,
      localLists,
      isColumnId,
      moveCard,
      reorderLists,
      fetchBoard,
    ]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 overflow-x-auto overflow-y-hidden px-6 pb-6">
        <div className="flex gap-4 items-start h-full">
          <SortableContext
            items={columnIds}
            strategy={horizontalListSortingStrategy}
          >
            {sortedLists.map((list) => (
              <SortableColumn key={list.id} list={list} boardId={board.id} />
            ))}
          </SortableContext>
          <AddListButton boardId={board.id} lists={board.lists} />
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeItem?.type === 'card' && (
          <div
            style={{
              transform: 'rotate(3deg) scale(1.02)',
              opacity: 0.8,
            }}
          >
            <div className="shadow-xl rounded-xl">
              <KanbanCard
                card={activeItem.card}
                onClick={() => {
                  /* overlay - no-op */
                }}
              />
            </div>
          </div>
        )}
        {activeItem?.type === 'column' && (
          <div
            style={{
              transform: 'rotate(2deg)',
              opacity: 0.85,
            }}
            className="shadow-xl rounded-card"
          >
            <div className="bg-surface rounded-card p-3 w-72 font-display text-base text-ink border-t-[3px]"
              style={{ borderColor: activeItem.list.color }}
            >
              {activeItem.list.title}
              <p className="font-body text-xs text-ink/40 mt-1">
                {activeItem.list.cards.length}{' '}
                {activeItem.list.cards.length === 1 ? 'card' : 'cards'}
              </p>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}
