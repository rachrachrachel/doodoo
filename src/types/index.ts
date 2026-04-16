import type { Database } from './database'

export type User = Database['public']['Tables']['users']['Row']
export type Board = Database['public']['Tables']['boards']['Row']
export type BoardMember = Database['public']['Tables']['board_members']['Row']
export type List = Database['public']['Tables']['lists']['Row']
export type Card = Database['public']['Tables']['cards']['Row']
export type Label = Database['public']['Tables']['labels']['Row']
export type ChecklistItem = Database['public']['Tables']['checklist_items']['Row']
export type ActivityLog = Database['public']['Tables']['activity_log']['Row']

// Extended types with relations
export interface CardWithRelations extends Card {
  assignees: User[]
  labels: Label[]
  checklist_items: ChecklistItem[]
}

export interface ListWithCards extends List {
  cards: CardWithRelations[]
}

export interface BoardWithLists extends Board {
  lists: ListWithCards[]
  members: User[]
  boardLabels: Label[]
}

export type BoardRole = 'owner' | 'member'
