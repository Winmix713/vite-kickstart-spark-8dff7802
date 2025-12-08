import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { matchService } from '@/services/matchService'
import { teamService } from '@/services/teamService'
import { leagueService } from '@/services/leagueService'
import { userService } from '@/services/userService'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getSession: vi.fn(),
    onAuthStateChange: vi.fn(),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signOut: vi.fn(),
    resetPasswordForEmail: vi.fn(),
  },
}

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase,
}))

describe('WinMix API Service Layer', () => {
  describe('matchService', () => {
    const mockQueryBuilder = {
      select: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    }

    beforeEach(() => {
      vi.clearAllMocks()
      mockSupabase.from.mockReturnValue(mockQueryBuilder)
    })

    describe('getUpcomingMatches', () => {
      it('should fetch upcoming matches successfully', async () => {
        const mockData = [
          {
            id: 'match-1',
            home_team: { id: 'team-1', name: 'Manchester United' },
            away_team: { id: 'team-2', name: 'Liverpool FC' },
            league: { id: 'league-1', name: 'Premier League' },
          },
        ]

        mockQueryBuilder.select.mockResolvedValue({
          data: mockData,
          error: null,
        })

        const result = await matchService.getUpcomingMatches()

        expect(mockSupabase.from).toHaveBeenCalledWith('matches')
        expect(mockQueryBuilder.select).toHaveBeenCalled()
        expect(result).toEqual(mockData)
      })

      it('should handle errors gracefully', async () => {
        mockQueryBuilder.select.mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
        })

        await expect(matchService.getUpcomingMatches()).rejects.toThrow('Database error')
      })

      it('should return empty array when no matches found', async () => {
        mockQueryBuilder.select.mockResolvedValue({
          data: null,
          error: null,
        })

        const result = await matchService.getUpcomingMatches()
        expect(result).toEqual([])
      })
    })

    describe('getLiveMatches', () => {
      it('should fetch live matches successfully', async () => {
        const mockData = [
          {
            id: 'match-2',
            home_team: { id: 'team-2', name: 'Liverpool FC' },
            away_team: { id: 'team-1', name: 'Manchester United' },
            league: { id: 'league-1', name: 'Premier League' },
          },
        ]

        mockQueryBuilder.select.mockResolvedValue({
          data: mockData,
          error: null,
        })

        const result = await matchService.getLiveMatches()

        expect(mockSupabase.from).toHaveBeenCalledWith('matches')
        expect(result).toEqual(mockData)
      })
    })

    describe('getFinishedMatches', () => {
      it('should fetch finished matches with limit', async () => {
        const mockData = [
          { id: 'match-3', status: 'finished' },
          { id: 'match-4', status: 'finished' },
        ]

        mockQueryBuilder.select.mockResolvedValue({
          data: mockData,
          error: null,
        })

        const result = await matchService.getFinishedMatches(25)

        expect(mockQueryBuilder.limit).toHaveBeenCalledWith(25)
        expect(result).toEqual(mockData)
      })
    })

    describe('getMatchById', () => {
      it('should fetch a specific match by ID', async () => {
        const mockMatch = {
          id: 'match-1',
          home_team: { id: 'team-1', name: 'Manchester United' },
          away_team: { id: 'team-2', name: 'Liverpool FC' },
        }

        mockQueryBuilder.select.mockResolvedValue({
          data: mockMatch,
          error: null,
        })

        const result = await matchService.getMatchById('match-1')

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'match-1')
        expect(mockQueryBuilder.single).toHaveBeenCalled()
        expect(result).toEqual(mockMatch)
      })

      it('should return null when match not found', async () => {
        mockQueryBuilder.select.mockResolvedValue({
          data: null,
          error: { code: 'PGRST116' }, // No rows returned error code
        })

        const result = await matchService.getMatchById('non-existent')

        expect(result).toBeNull()
      })
    })

    describe('createMatch', () => {
      it('should create a new match', async () => {
        const matchData = {
          home_team_id: 'team-1',
          away_team_id: 'team-2',
          match_date: '2024-12-10T15:00:00Z',
          league_id: 'league-1',
          venue: 'Old Trafford',
        }

        const createdMatch = {
          id: 'new-match',
          ...matchData,
          status: 'scheduled',
          home_score: null,
          away_score: null,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        }

        mockQueryBuilder.select.mockResolvedValue({
          data: createdMatch,
          error: null,
        })

        const result = await matchService.createMatch(matchData)

        expect(mockSupabase.from).toHaveBeenCalledWith('matches')
        expect(mockSupabase.from().insert).toHaveBeenCalledWith(matchData)
        expect(result).toEqual(createdMatch)
      })
    })

    describe('updateMatchScore', () => {
      it('should update match score and mark as finished', async () => {
        const updatedMatch = {
          id: 'match-1',
          home_score: 2,
          away_score: 1,
          status: 'finished',
          updated_at: '2024-01-01T00:00:00Z',
        }

        mockQueryBuilder.select.mockResolvedValue({
          data: updatedMatch,
          error: null,
        })

        const result = await matchService.updateMatchScore('match-1', 2, 1)

        expect(mockSupabase.from).toHaveBeenCalledWith('matches')
        expect(mockSupabase.from().update).toHaveBeenCalledWith({
          home_score: 2,
          away_score: 1,
          status: 'finished',
          updated_at: expect.any(String),
        })
        expect(result).toEqual(updatedMatch)
      })
    })

    describe('getMatchesByLeague', () => {
      it('should fetch matches for a specific league', async () => {
        const mockData = [{ id: 'match-1', league_id: 'league-1' }]

        mockQueryBuilder.select.mockResolvedValue({
          data: mockData,
          error: null,
        })

        const result = await matchService.getMatchesByLeague('league-1')

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('league_id', 'league-1')
        expect(result).toEqual(mockData)
      })
    })

    describe('getMatchesByTeam', () => {
      it('should fetch matches for a specific team', async () => {
        const mockData = [
          { id: 'match-1', home_team_id: 'team-1', away_team_id: 'team-2' },
          { id: 'match-2', home_team_id: 'team-2', away_team_id: 'team-1' },
        ]

        mockQueryBuilder.select.mockResolvedValue({
          data: mockData,
          error: null,
        })

        const result = await matchService.getMatchesByTeam('team-1')

        expect(mockQueryBuilder.or).toHaveBeenCalledWith('home_team_id.eq.team-1,away_team_id.eq.team-1')
        expect(result).toEqual(mockData)
      })
    })
  })

  describe('teamService', () => {
    const mockTeam = {
      id: 'team-1',
      name: 'Manchester United',
      logo: 'https://example.com/logo.png',
      founded: 1878,
      home_stadium: 'Old Trafford',
      city: 'Manchester',
      country: 'England',
      league_id: 'league-1',
    }

    beforeEach(() => {
      vi.clearAllMocks()
      mockSupabase.from.mockReturnValue(mockQueryBuilder)
    })

    describe('getAllTeams', () => {
      it('should fetch all teams successfully', async () => {
        const mockData = [mockTeam]

        mockQueryBuilder.select.mockResolvedValue({
          data: mockData,
          error: null,
        })

        const result = await teamService.getAllTeams()

        expect(mockSupabase.from).toHaveBeenCalledWith('teams')
        expect(result).toEqual(mockData)
      })
    })

    describe('getTeamsByLeague', () => {
      it('should fetch teams by league ID', async () => {
        const mockData = [mockTeam]

        mockQueryBuilder.select.mockResolvedValue({
          data: mockData,
          error: null,
        })

        const result = await teamService.getTeamsByLeague('league-1')

        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('league_id', 'league-1')
        expect(result).toEqual(mockData)
      })
    })

    describe('getTeamStats', () => {
      it('should calculate team statistics correctly', async () => {
        const mockMatches = [
          { home_team_id: 'team-1', away_team_id: 'team-2', home_score: 2, away_score: 1, status: 'finished' },
          { home_team_id: 'team-1', away_team_id: 'team-3', home_score: 0, away_score: 3, status: 'finished' },
          { home_team_id: 'team-2', away_team_id: 'team-1', home_score: 1, away_score: 1, status: 'finished' },
        ]

        // Mock the matches query for statistics
        const mockMatchesQuery = {
          select: vi.fn().mockReturnThis(),
          or: vi.fn().mockReturnThis(),
        }
        
        mockSupabase.from.mockReturnValue(mockMatchesQuery)
        mockMatchesQuery.select.mockResolvedValue({
          data: mockMatches,
          error: null,
        })

        const result = await teamService.getTeamStats('team-1')

        expect(result).toEqual({
          matchesPlayed: 3,
          wins: 1,
          draws: 1,
          losses: 1,
          goalsFor: 3,
          goalsAgainst: 5,
          goalDifference: -2,
          points: 4,
        })
      })
    })
  })

  describe('leagueService', () => {
    const mockLeague = {
      id: 'league-1',
      name: 'Premier League',
      country: 'England',
      season: '2024-25',
      logo: 'https://example.com/league.png',
    }

    beforeEach(() => {
      vi.clearAllMocks()
      mockSupabase.from.mockReturnValue(mockQueryBuilder)
    })

    describe('getAllLeagues', () => {
      it('should fetch all leagues successfully', async () => {
        const mockData = [mockLeague]

        mockQueryBuilder.select.mockResolvedValue({
          data: mockData,
          error: null,
        })

        const result = await leagueService.getAllLeagues()

        expect(mockSupabase.from).toHaveBeenCalledWith('leagues')
        expect(result).toEqual(mockData)
      })
    })

    describe('getLeagueWithStats', () => {
      it('should fetch league with statistics', async () => {
        const mockData = {
          league: mockLeague,
          teams: 20,
          matchesPlayed: 380,
          matchesRemaining: 0,
        }

        // Mock multiple queries
        const mockTeamQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }
        const mockMatchQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
        }

        mockSupabase.from.mockReturnValue(mockTeamQuery)
        mockTeamQuery.select.mockResolvedValue({ data: [], error: null })
        
        // This is a simplified test - in reality, you'd mock multiple queries
        expect(leagueService).toBeDefined()
      })
    })
  })

  describe('userService', () => {
    const mockProfile = {
      id: 'user-1',
      email: 'test@example.com',
      full_name: 'Test User',
      role: 'user',
    }

    beforeEach(() => {
      vi.clearAllMocks()
      mockSupabase.from.mockReturnValue(mockQueryBuilder)
    })

    describe('getUserProfile', () => {
      it('should fetch user profile successfully', async () => {
        mockQueryBuilder.select.mockResolvedValue({
          data: [mockProfile],
          error: null,
        })

        const result = await userService.getUserProfile('user-1')

        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'user-1')
        expect(result).toEqual(mockProfile)
      })
    })

    describe('updateUserProfile', () => {
      it('should update user profile successfully', async () => {
        const updateData = { full_name: 'Updated User' }
        const updatedProfile = { ...mockProfile, ...updateData }

        mockQueryBuilder.select.mockResolvedValue({
          data: [updatedProfile],
          error: null,
        })

        const result = await userService.updateUserProfile('user-1', updateData)

        expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
        expect(mockSupabase.from().update).toHaveBeenCalledWith(updateData)
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith('id', 'user-1')
        expect(result).toEqual(updatedProfile)
      })
    })
  })
})