/**
 * WinMix API Service Layer
 * 
 * Comprehensive typed data-access layer that wraps Supabase client and exposes
 * focused helpers for all WinMix widgets and components. This service normalizes
 * responses to ensure existing UI components can consume them without structural rewrites.
 */

import { supabase } from '@/integrations/supabase/client'
import type { Database } from '@/integrations/supabase/types'

// Type definitions from Supabase schema
type League = Database['public']['Tables']['leagues']['Row']
type Team = Database['public']['Tables']['teams']['Row']
type Match = Database['public']['Tables']['matches']['Row']
type Prediction = Database['public']['Tables']['predictions']['Row']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']

// Optional tables that might not exist in all schemas
type Player = Database['public']['Tables']['players'] extends { Row: infer R } ? R : { id: string; name: string }
type Product = Database['public']['Tables']['products'] extends { Row: infer R } ? R : { id: string; name: string; price: number }
type ChatMessage = Database['public']['Tables']['chat_messages'] extends { Row: infer R } ? R : { id: string; message: string; created_at: string }
type Schedule = Database['public']['Tables']['schedule'] extends { Row: infer R } ? R : { id: string; title: string; date: string; type: string }
type ModelPerformance = Database['public']['Tables']['model_performance'] extends { Row: infer R } ? R : { id: string; created_at: string }
type DetectedPattern = Database['public']['Tables']['detected_patterns'] extends { Row: infer R } ? R : { id: string; created_at: string }
type TeamPattern = Database['public']['Tables']['team_patterns'] extends { Row: infer R } ? R : { id: string; created_at: string }

// Extended types with relations
interface MatchWithTeams extends Match {
  home_team: Team
  away_team: Team
  league: League
  predictions?: Prediction[]
}

interface TeamWithStats extends Team {
  matches_played: number
  wins: number
  draws: number
  losses: number
  goals_scored: number
  goals_conceded: number
  points: number
  form: string[] // Last 5 matches: ['W', 'D', 'L']
}

interface PlayerWithStats extends Player {
  stats: {
    goals: number
    assists: number
    appearances: number
    minutes: number
    rating: number
  }
}

interface PredictionWithMatch extends Prediction {
  match: MatchWithTeams
  match_prediction_factors?: any
}

interface ProductWithCategory extends Product {
  category: {
    id: string
    name: string
  }
}

interface ChatMessageWithUser extends ChatMessage {
  user: UserProfile
}

interface SystemStatus {
  health: 'healthy' | 'warning' | 'critical'
  uptime: number
  lastUpdated: string
  metrics: {
    activeUsers: number
    responseTime: number
    errorRate: number
  }
}

// League Standings Response (normalized for UI)
interface LeagueStanding {
  position: number
  team: {
    id: string
    name: string
    logo_url?: string
    short_name: string
  }
  stats: {
    played: number
    won: number
    drawn: number
    lost: number
    goals_for: number
    goals_against: number
    goal_difference: number
    points: number
  }
  form: string // e.g., "WWDLW"
}

// Chat and Notification Types
interface ChatConversation {
  id: string
  participants: UserProfile[]
  lastMessage: ChatMessageWithUser
  unreadCount: number
  createdAt: string
}

interface NotificationData {
  id: string
  type: 'match' | 'prediction' | 'system' | 'chat'
  title: string
  message: string
  timestamp: string
  read: boolean
  data?: any
}

// Prediction Data Types
interface PredictionData {
  id: string
  match: {
    id: string
    homeTeam: Team
    awayTeam: Team
    league: League
    date: string
    venue?: string
  }
  prediction: {
    outcome: 'home_win' | 'draw' | 'away_win'
    confidence: number
    predicted_score: {
      home: number
      away: number
    }
    btts_prediction: boolean
    over_under_prediction: {
      line: number
      direction: 'over' | 'under'
    }
  }
  model: {
    name: string
    version: string
  }
  factors: {
    momentum: number
    home_advantage: number
    head_to_head: number
    form_rating: number
  }
  status: 'pending' | 'correct' | 'incorrect' | 'cancelled'
  created_at: string
}

// Schedule Types
interface ScheduleItem {
  id: string
  title: string
  type: 'training' | 'match' | 'meeting' | 'event'
  date: string
  duration: number
  location?: string
  description?: string
  participants?: string[]
  status: 'scheduled' | 'completed' | 'cancelled'
}

// Analytics Types
interface LeagueAnalytics {
  league: League
  stats: {
    totalMatches: number
    avgGoalsPerMatch: number
    homeWinPercentage: number
    drawPercentage: number
    awayWinPercentage: number
    bttsPercentage: number
    topScorers: Array<{
      player: Player
      goals: number
    }>
  }
  trends: {
    recentForm: string[]
    goalTrends: number[]
    attendanceTrends: number[]
  }
}

// Store/Product Types
interface ProductInventory {
  id: string
  name: string
  description: string
  price: number
  category: {
    id: string
    name: string
  }
  variants: Array<{
    id: string
    name: string
    price: number
    available: boolean
  }>
  images: string[]
  inStock: boolean
  rating: number
  reviews: number
}

// Main WinMix API Service
export const winmixApi = {
  // ===== LEAGUE STANDINGS =====
  async fetchLeagueStandings(leagueId: string): Promise<LeagueStanding[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues!matches_league_id_fkey(*)
        `)
        .eq('league_id', leagueId)
        .eq('status', 'finished')
        .order('match_date', { ascending: false })

      if (error) throw error

      // Calculate standings
      const teamStats = new Map<string, LeagueStanding['stats']>()
      const teamNames = new Map<string, { name: string; logo_url?: string; short_name: string }>()
      const teamForms = new Map<string, string[]>()

      data?.forEach(match => {
        // Initialize team stats if not exists
        if (!teamStats.has(match.home_team_id)) {
          teamStats.set(match.home_team_id, {
            played: 0, won: 0, drawn: 0, lost: 0,
            goals_for: 0, goals_against: 0, goal_difference: 0, points: 0
          })
          teamNames.set(match.home_team.id, {
            name: match.home_team.name,
            logo_url: match.home_team.logo_url,
            short_name: match.home_team.short_name
          })
          teamForms.set(match.home_team.id, [])
        }

        if (!teamStats.has(match.away_team_id)) {
          teamStats.set(match.away_team_id, {
            played: 0, won: 0, drawn: 0, lost: 0,
            goals_for: 0, goals_against: 0, goal_difference: 0, points: 0
          })
          teamNames.set(match.away_team.id, {
            name: match.away_team.name,
            logo_url: match.away_team.logo_url,
            short_name: match.away_team.short_name
          })
          teamForms.set(match.away_team.id, [])
        }

        // Update stats
        const homeStats = teamStats.get(match.home_team_id)!
        const awayStats = teamStats.get(match.away_team_id)!
        
        homeStats.played++
        awayStats.played++
        
        homeStats.goals_for += match.home_score || 0
        homeStats.goals_against += match.away_score || 0
        awayStats.goals_for += match.away_score || 0
        awayStats.goals_against += match.home_score || 0
        
        homeStats.goal_difference = homeStats.goals_for - homeStats.goals_against
        awayStats.goal_difference = awayStats.goals_for - awayStats.goals_against

        // Determine result and update form
        if ((match.home_score || 0) > (match.away_score || 0)) {
          homeStats.won++
          awayStats.lost++
          homeStats.points += 3
          
          const homeForm = teamForms.get(match.home_team_id)!
          homeForm.unshift('W')
          homeForm.splice(5)
          const awayForm = teamForms.get(match.away_team_id)!
          awayForm.unshift('L')
          awayForm.splice(5)
        } else if ((match.home_score || 0) < (match.away_score || 0)) {
          homeStats.lost++
          awayStats.won++
          awayStats.points += 3
          
          const homeForm = teamForms.get(match.home_team_id)!
          homeForm.unshift('L')
          homeForm.splice(5)
          const awayForm = teamForms.get(match.away_team_id)!
          awayForm.unshift('W')
          awayForm.splice(5)
        } else {
          homeStats.drawn++
          awayStats.drawn++
          homeStats.points++
          awayStats.points++
          
          const homeForm = teamForms.get(match.home_team_id)!
          homeForm.unshift('D')
          homeForm.splice(5)
          const awayForm = teamForms.get(match.away_team_id)!
          awayForm.unshift('D')
          awayForm.splice(5)
        }
      })

      // Convert to final standings format
      const standings: LeagueStanding[] = Array.from(teamStats.entries())
        .map(([teamId, stats], index) => ({
          position: index + 1,
          team: {
            id: teamId,
            name: teamNames.get(teamId)!.name,
            logo_url: teamNames.get(teamId)!.logo_url,
            short_name: teamNames.get(teamId)!.short_name
          },
          stats,
          form: teamForms.get(teamId)!.join('')
        }))
        .sort((a, b) => {
          if (a.stats.points !== b.stats.points) return b.stats.points - a.stats.points
          if (a.stats.goal_difference !== b.stats.goal_difference) return b.stats.goal_difference - a.stats.goal_difference
          return b.stats.goals_for - a.stats.goals_for
        })
        .map((standing, index) => ({ ...standing, position: index + 1 }))

      return standings
    } catch (error) {
      console.error('Error fetching league standings:', error)
      throw error
    }
  },

  // ===== LIVE MATCHES =====
  async fetchLiveMatches(): Promise<MatchWithTeams[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues!matches_league_id_fkey(*)
        `)
        .eq('status', 'live')
        .order('match_date', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching live matches:', error)
      throw error
    }
  },

  // ===== FINISHED MATCHES =====
  async fetchFinishedMatches(limit = 50): Promise<MatchWithTeams[]> {
    try {
      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues!matches_league_id_fkey(*)
        `)
        .eq('status', 'finished')
        .order('match_date', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching finished matches:', error)
      throw error
    }
  },

  // ===== PLAYER PROFILE =====
  async fetchPlayerProfile(playerId: string): Promise<PlayerWithStats | null> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .eq('id', playerId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }

      // Fetch player stats (you would need to create this table or calculate from matches)
      // For now, returning mock data structure
      const playerWithStats: PlayerWithStats = {
        ...data,
        stats: {
          goals: 0,
          assists: 0,
          appearances: 0,
          minutes: 0,
          rating: 0
        }
      }

      return playerWithStats
    } catch (error) {
      console.error('Error fetching player profile:', error)
      throw error
    }
  },

  // ===== STORE INVENTORY =====
  async fetchStoreInventory(category?: string): Promise<ProductInventory[]> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          product_categories:product_categories(*)
        `)

      if (category) {
        query = query.eq('product_categories.name', category)
      }

      const { data, error } = await query.order('name')

      if (error) throw error

      return (data || []).map(product => ({
        id: product.id,
        name: product.name,
        description: product.description || '',
        price: product.price,
        category: product.product_categories,
        variants: [], // Would need to fetch from separate table
        images: product.images || [],
        inStock: (product.stock_quantity || 0) > 0,
        rating: product.rating || 0,
        reviews: product.review_count || 0
      }))
    } catch (error) {
      console.error('Error fetching store inventory:', error)
      throw error
    }
  },

  // ===== CHAT MESSAGES =====
  async fetchChatMessages(conversationId?: string): Promise<ChatMessageWithUser[]> {
    try {
      let query = supabase
        .from('chat_messages')
        .select(`
          *,
          user:user_profiles(*)
        `)

      if (conversationId) {
        query = query.eq('conversation_id', conversationId)
      }

      const { data, error } = await query
        .order('created_at', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching chat messages:', error)
      throw error
    }
  },

  // ===== SCHEDULE =====
  async fetchSchedule(type?: 'training' | 'match' | 'meeting' | 'event'): Promise<ScheduleItem[]> {
    try {
      let query = supabase
        .from('schedule')
        .select('*')

      if (type) {
        query = query.eq('type', type)
      }

      const { data, error } = await query
        .gte('date', new Date().toISOString())
        .order('date', { ascending: true })

      if (error) throw error

      return (data || []).map(schedule => ({
        id: schedule.id,
        title: schedule.title,
        type: schedule.type,
        date: schedule.date,
        duration: schedule.duration || 60,
        location: schedule.location || '',
        description: schedule.description || '',
        status: schedule.status
      }))
    } catch (error) {
      console.error('Error fetching schedule:', error)
      throw error
    }
  },

  // ===== PREDICTIONS =====
  async fetchPredictions(limit = 20): Promise<PredictionData[]> {
    try {
      const { data, error } = await supabase
        .from('predictions')
        .select(`
          *,
          match:matches(
            *,
            home_team:teams!matches_home_team_id_fkey(*),
            away_team:teams!matches_away_team_id_fkey(*),
            league:leagues!matches_league_id_fkey(*)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      return (data || []).map(prediction => ({
        id: prediction.id,
        match: {
          id: prediction.match.id,
          homeTeam: prediction.match.home_team,
          awayTeam: prediction.match.away_team,
          league: prediction.match.league,
          date: prediction.match.match_date,
          venue: prediction.match.venue || ''
        },
        prediction: {
          outcome: prediction.predicted_outcome as 'home_win' | 'draw' | 'away_win',
          confidence: prediction.confidence_score,
          predicted_score: {
            home: prediction.predicted_home_score,
            away: prediction.predicted_away_score
          },
          btts_prediction: prediction.btts_prediction,
          over_under_prediction: {
            line: 2.5, // Would need to calculate from data
            direction: 'over'
          }
        },
        model: {
          name: prediction.model_name || 'Unknown',
          version: prediction.model_version || '1.0'
        },
        factors: prediction.prediction_factors || {
          momentum: 0,
          home_advantage: 0,
          head_to_head: 0,
          form_rating: 0
        },
        status: 'pending',
        created_at: prediction.created_at
      }))
    } catch (error) {
      console.error('Error fetching predictions:', error)
      throw error
    }
  },

  // ===== TODOS/TASKS =====
  async fetchTodos(): Promise<Array<{
    id: string
    title: string
    completed: boolean
    priority: 'low' | 'medium' | 'high'
    dueDate?: string
    assignedTo?: string
  }>> {
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(todo => ({
        id: todo.id,
        title: todo.title,
        completed: todo.completed,
        priority: todo.priority || 'medium',
        dueDate: todo.due_date,
        assignedTo: todo.assigned_to
      }))
    } catch (error) {
      console.error('Error fetching todos:', error)
      throw error
    }
  },

  // ===== SYSTEM STATUS =====
  async fetchSystemStatus(): Promise<SystemStatus> {
    try {
      const { data, error } = await supabase
        .from('system_health_metrics')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // Return default status if no data
        return {
          health: 'healthy',
          uptime: 0,
          lastUpdated: new Date().toISOString(),
          metrics: {
            activeUsers: 0,
            responseTime: 0,
            errorRate: 0
          }
        }
      }

      return {
        health: data.error_rate > 0.05 ? 'critical' : data.error_rate > 0.02 ? 'warning' : 'healthy',
        uptime: 0, // Would need to calculate from start time
        lastUpdated: data.timestamp,
        metrics: {
          activeUsers: data.active_users || 0,
          responseTime: data.api_response_time || 0,
          errorRate: data.error_rate || 0
        }
      }
    } catch (error) {
      console.error('Error fetching system status:', error)
      throw error
    }
  },

  // ===== TEAM ANALYTICS =====
  async fetchTeamAnalytics(teamId: string): Promise<{
    team: Team
    stats: {
      matches: number
      wins: number
      draws: number
      losses: number
      goalsFor: number
      goalsAgainst: number
      cleanSheets: number
    }
    recentForm: string[]
    nextMatches: MatchWithTeams[]
  }> {
    try {
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single()

      if (teamError) throw teamError

      const { data: matches, error: matchesError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues!matches_league_id_fkey(*)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .eq('status', 'finished')
        .order('match_date', { ascending: false })
        .limit(10)

      if (matchesError) throw matchesError

      const { data: upcomingMatches, error: upcomingError } = await supabase
        .from('matches')
        .select(`
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues!matches_league_id_fkey(*)
        `)
        .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
        .in('status', ['scheduled', 'live'])
        .order('match_date', { ascending: true })
        .limit(5)

      if (upcomingError) throw upcomingError

      // Calculate stats
      let wins = 0, draws = 0, losses = 0
      let goalsFor = 0, goalsAgainst = 0, cleanSheets = 0
      const recentForm: string[] = []

      matches?.forEach(match => {
        const isHome = match.home_team_id === teamId
        const teamScore = isHome ? (match.home_score || 0) : (match.away_score || 0)
        const oppScore = isHome ? (match.away_score || 0) : (match.home_score || 0)

        goalsFor += teamScore
        goalsAgainst += oppScore

        if (teamScore > oppScore) {
          wins++
          recentForm.unshift('W')
        } else if (teamScore === oppScore) {
          draws++
          recentForm.unshift('D')
        } else {
          losses++
          recentForm.unshift('L')
        }

        if (oppScore === 0) cleanSheets++
        recentForm.splice(5)
      })

      return {
        team,
        stats: {
          matches: matches?.length || 0,
          wins, draws, losses,
          goalsFor, goalsAgainst,
          cleanSheets
        },
        recentForm,
        nextMatches: upcomingMatches || []
      }
    } catch (error) {
      console.error('Error fetching team analytics:', error)
      throw error
    }
  }
}

export default winmixApi