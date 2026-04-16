import type { CSSProperties } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { ListWithCards } from '@/types'
import { KanbanColumn } from '@/components/lists/KanbanColumn'

interface SortableColumnProps {
  list: ListWithCards
  boardId: string
}

export function SortableColumn({ list, boardId }: SortableColumnProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: list.id,
    data: {
      type: 'column',
      list,
    },
  })

  const style: CSSProperties = {
    transform: CSS.Transform.toString(
      transform ? { ...transform, scaleX: 1, scaleY: 1 } : null
    ),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style}>
      <KanbanColumn
        list={list}
        boardId={boardId}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  )
}
