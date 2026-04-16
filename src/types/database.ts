export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      boards: {
        Row: {
          id: string
          title: string
          description: string | null
          cover_color: string
          owner_id: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          cover_color?: string
          owner_id: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          cover_color?: string
        }
        Relationships: []
      }
      board_members: {
        Row: {
          board_id: string
          user_id: string
          role: 'owner' | 'member'
        }
        Insert: {
          board_id: string
          user_id: string
          role?: 'owner' | 'member'
        }
        Update: {
          role?: 'owner' | 'member'
        }
        Relationships: []
      }
      lists: {
        Row: {
          id: string
          board_id: string
          title: string
          color: string
          position: number
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          title: string
          color?: string
          position: number
          created_at?: string
        }
        Update: {
          title?: string
          color?: string
          position?: number
        }
        Relationships: []
      }
      cards: {
        Row: {
          id: string
          list_id: string
          title: string
          description: string | null
          due_date: string | null
          position: number
          created_by: string
          created_at: string
        }
        Insert: {
          id?: string
          list_id: string
          title: string
          description?: string | null
          due_date?: string | null
          position: number
          created_by: string
          created_at?: string
        }
        Update: {
          title?: string
          description?: string | null
          due_date?: string | null
          position?: number
          list_id?: string
        }
        Relationships: []
      }
      card_assignees: {
        Row: { card_id: string; user_id: string }
        Insert: { card_id: string; user_id: string }
        Update: never
        Relationships: []
      }
      labels: {
        Row: {
          id: string
          board_id: string
          name: string
          color: string
        }
        Insert: {
          id?: string
          board_id: string
          name: string
          color: string
        }
        Update: {
          name?: string
          color?: string
        }
        Relationships: []
      }
      card_labels: {
        Row: { card_id: string; label_id: string }
        Insert: { card_id: string; label_id: string }
        Update: never
        Relationships: []
      }
      checklist_items: {
        Row: {
          id: string
          card_id: string
          text: string
          completed: boolean
          position: number
        }
        Insert: {
          id?: string
          card_id: string
          text: string
          completed?: boolean
          position: number
        }
        Update: {
          text?: string
          completed?: boolean
          position?: number
        }
        Relationships: []
      }
      activity_log: {
        Row: {
          id: string
          board_id: string
          user_id: string
          action: string
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          board_id: string
          user_id: string
          action: string
          metadata?: Json | null
          created_at?: string
        }
        Update: never
        Relationships: []
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
    CompositeTypes: {}
  }
}
