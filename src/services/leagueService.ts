import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type League = Database['public']['Tables']['leagues']['Row']

interface CreateLeagueInput {
  name: string
  short_name: string
  country: string
  logo_url?: string
  season: string
  is_active?: boolean
}

export const leagueService = {
  async getAllLeagues(): Promise<League[]> {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getActiveLeagues(): Promise<League[]> {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getLeagueById(id: string): Promise<League | null> {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  async getLeaguesByCountry(country: string): Promise<League[]> {
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .eq('country', country)
      .order('name', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async createLeague(leagueData: CreateLeagueInput): Promise<League> {
    const { data, error } = await supabase
      .from('leagues')
      .insert(leagueData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateLeague(id: string, leagueData: Partial<CreateLeagueInput>): Promise<League> {
    const { data, error } = await supabase
      .from('leagues')
      .update({
        ...leagueData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async deleteLeague(id: string): Promise<void> {
    const { error } = await supabase
      .from('leagues')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  },

  async toggleLeagueStatus(id: string, isActive: boolean): Promise<League> {
    const { data, error } = await supabase
      .from('leagues')
      .update({
        is_active: isActive,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()
    
    if (error) throw error
    return data
  }
}