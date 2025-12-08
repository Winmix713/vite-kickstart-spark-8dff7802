import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { matchService } from '@/services/matchService'

// Query keys
export const matchKeys = {
  all: ['matches'] as const,
  lists: () => [...matchKeys.all, 'list'] as const,
  list: (filters: string) => [...matchKeys.lists(), { filters }] as const,
  details: () => [...matchKeys.all, 'detail'] as const,
  detail: (id: string) => [...matchKeys.details(), id] as const,
}

// Hooks for matches
export const useUpcomingMatches = () => {
  return useQuery({
    queryKey: matchKeys.list('upcoming'),
    queryFn: matchService.getUpcomingMatches,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useLiveMatches = () => {
  return useQuery({
    queryKey: matchKeys.list('live'),
    queryFn: matchService.getLiveMatches,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 30000, // 30 seconds for live matches
  })
}

export const useFinishedMatches = (limit = 50) => {
  return useQuery({
    queryKey: matchKeys.list('finished'),
    queryFn: () => matchService.getFinishedMatches(limit),
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useMatch = (id: string) => {
  return useQuery({
    queryKey: matchKeys.detail(id),
    queryFn: () => matchService.getMatchById(id),
    enabled: !!id,
  })
}

export const useMatchesByLeague = (leagueId: string) => {
  return useQuery({
    queryKey: [...matchKeys.list('byLeague'), leagueId],
    queryFn: () => matchService.getMatchesByLeague(leagueId),
    enabled: !!leagueId,
  })
}

export const useMatchesByTeam = (teamId: string) => {
  return useQuery({
    queryKey: [...matchKeys.list('byTeam'), teamId],
    queryFn: () => matchService.getMatchesByTeam(teamId),
    enabled: !!teamId,
  })
}

// Mutations
export const useCreateMatch = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: matchService.createMatch,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
    },
  })
}

export const useUpdateMatchScore = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ matchId, homeScore, awayScore }: {
      matchId: string
      homeScore: number
      awayScore: number
    }) => matchService.updateMatchScore(matchId, homeScore, awayScore),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
    },
  })
}

export const useUpdateMatchStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ matchId, status }: {
      matchId: string
      status: 'scheduled' | 'live' | 'finished' | 'cancelled'
    }) => matchService.updateMatchStatus(matchId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: matchKeys.lists() })
    },
  })
}