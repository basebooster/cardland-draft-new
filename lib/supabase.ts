import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string | null
          role: 'admin' | 'user'
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          role?: 'admin' | 'user'
          created_at?: string
        }
      }
      drafts: {
        Row: {
          id: string
          name: string
          description: string | null
          start_time: string
          created_by: string
          auto_pick_order: string[] | null
          status: 'pending' | 'active' | 'completed'
          timer_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          start_time: string
          created_by: string
          auto_pick_order?: string[] | null
          status?: 'pending' | 'active' | 'completed'
          timer_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          start_time?: string
          created_by?: string
          auto_pick_order?: string[] | null
          status?: 'pending' | 'active' | 'completed'
          timer_minutes?: number
          created_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          user_id: string
          draft_id: string
          pick_order: number
          status: 'waiting' | 'picking' | 'completed'
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          draft_id: string
          pick_order: number
          status?: 'waiting' | 'picking' | 'completed'
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          draft_id?: string
          pick_order?: number
          status?: 'waiting' | 'picking' | 'completed'
          created_at?: string
        }
      }
      selections: {
        Row: {
          id: string
          draft_id: string
          name: string
          image_url: string | null
          is_taken: boolean
          fallback_order: number | null
          created_at: string
        }
        Insert: {
          id?: string
          draft_id: string
          name: string
          image_url?: string | null
          is_taken?: boolean
          fallback_order?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          draft_id?: string
          name?: string
          image_url?: string | null
          is_taken?: boolean
          fallback_order?: number | null
          created_at?: string
        }
      }
      picks: {
        Row: {
          id: string
          draft_id: string
          user_id: string
          selection_id: string
          round: number
          timestamp: string
          is_auto_pick: boolean
        }
        Insert: {
          id?: string
          draft_id: string
          user_id: string
          selection_id: string
          round: number
          timestamp?: string
          is_auto_pick?: boolean
        }
        Update: {
          id?: string
          draft_id?: string
          user_id?: string
          selection_id?: string
          round?: number
          timestamp?: string
          is_auto_pick?: boolean
        }
      }
    }
  }
}