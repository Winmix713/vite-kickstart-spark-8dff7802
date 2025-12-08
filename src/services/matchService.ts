import { supabase } from '@/lib/supabase'
import type { Database } from '@/lib/supabase'

type Match = Database['public']['Tables']['matches']['Row']
type Team = Database['public']['Tables']['teams']['Row']
type League = Database['public']['Tables']['leagues']['Row']

interface MatchWithTeams extends Match {
  home_team: Team
  away_team: Team
  league: League
}

interface CreateMatchInput {
  home_team_id: string
  away_team_id: string
  match_date: string
  league_id: string
  venue?: string
}

export const matchService = {
  async getUpcomingMatches(): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .gte('match_date', new Date().toISOString())
      .eq('status', 'scheduled')
      .order('match_date', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getLiveMatches(): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq('status', 'live')
      .order('match_date', { ascending: true })
    
    if (error) throw error
    return data || []
  },

  async getFinishedMatches(limit = 50): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(limit)
    
    if (error) throw error
    return data || []
  },

  async getMatchById(id: string): Promise<MatchWithTeams | null> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq('id', id)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // No rows returned
      throw error
    }
    return data
  },

  async createMatch(matchData: CreateMatchInput): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .insert(matchData)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateMatchScore(
    matchId: string, 
    homeScore: number, 
    awayScore: number
  ): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update({
        home_score: homeScore,
        away_score: awayScore,
        status: 'finished',
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async updateMatchStatus(
    matchId: string, 
    status: 'scheduled' | 'live' | 'finished' | 'cancelled'
  ): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  async getMatchesByLeague(leagueId: string): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq('league_id', leagueId)
      .order('match_date', { ascending: false })
    
    if (error) throw error
    return data || []
  },

  async getMatchesByTeam(teamId: string): Promise<MatchWithTeams[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .order('match_date', { ascending: false })
    
    if (error) throw error
    return data || []
  }
}