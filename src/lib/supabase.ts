import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials. Please check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'user' | 'analyst'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user' | 'analyst'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'user' | 'analyst'
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          name: string
          short_name: string
          logo_url: string | null
          league_id: string
          founded: number | null
          stadium: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          logo_url?: string | null
          league_id: string
          founded?: number | null
          stadium?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          logo_url?: string | null
          league_id?: string
          founded?: number | null
          stadium?: string | null
          updated_at?: string
        }
      }
      matches: {
        Row: {
          id: string
          home_team_id: string
          away_team_id: string
          match_date: string
          league_id: string
          status: 'scheduled' | 'live' | 'finished' | 'cancelled'
          home_score: number | null
          away_score: number | null
          venue: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          home_team_id: string
          away_team_id: string
          match_date: string
          league_id: string
          status?: 'scheduled' | 'live' | 'finished' | 'cancelled'
          home_score?: number | null
          away_score?: number | null
          venue?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          home_team_id?: string
          away_team_id?: string
          match_date?: string
          league_id?: string
          status?: 'scheduled' | 'live' | 'finished' | 'cancelled'
          home_score?: number | null
          away_score?: number | null
          venue?: string | null
          updated_at?: string
        }
      }
      leagues: {
        Row: {
          id: string
          name: string
          short_name: string
          country: string
          logo_url: string | null
          season: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          country: string
          logo_url?: string | null
          season: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          country?: string
          logo_url?: string | null
          season?: string
          is_active?: boolean
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}