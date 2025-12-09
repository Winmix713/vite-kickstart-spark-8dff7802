import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

type Player = Database['public']['Tables']['players']['Row']
type Team = Database['public']['Tables']['teams']['Row']

interface PlayerWithTeam extends Player {
  team: Team
}

export const playerService = {
  async getPlayersByTeam(teamId: string): Promise<PlayerWithTeam[]> {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        team:teams(*)
      `)
      .eq('team_id', teamId)
      .order('is_captain', { ascending: false })
      .order('jersey_number', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getAllPlayers(): Promise<PlayerWithTeam[]> {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        team:teams(*)
      `)
      .order('team_id')
      .order('is_captain', { ascending: false })
      .order('jersey_number', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getPlayerById(id: string): Promise<PlayerWithTeam | null> {
    const { data, error } = await supabase
      .from('players')
      .select(`
        *,
        team:teams(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data
  },

  async updatePlayer(id: string, updates: Partial<Player>): Promise<Player> {
    const { data, error } = await supabase
      .from('players')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}