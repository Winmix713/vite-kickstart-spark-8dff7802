import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { teamService } from '@/services/teamService'

// Query keys
export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  list: (filters: string) => [...teamKeys.lists(), { filters }] as const,
  details: () => [...teamKeys.all, 'detail'] as const,
  detail: (id: string) => [...teamKeys.details(), id] as const,
}

// Hooks for teams
export const useAllTeams = () => {
  return useQuery({
    queryKey: teamKeys.list('all'),
    queryFn: teamService.getAllTeams,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useTeamsByLeague = (leagueId: string) => {
  return useQuery({
    queryKey: [...teamKeys.list('byLeague'), leagueId],
    queryFn: () => teamService.getTeamsByLeague(leagueId),
    enabled: !!leagueId,
  })
}

export const useTeam = (id: string) => {
  return useQuery({
    queryKey: teamKeys.detail(id),
    queryFn: () => teamService.getTeamById(id),
    enabled: !!id,
  })
}

export const useTeamWithStats = (id: string) => {
  return useQuery({
    queryKey: [...teamKeys.detail(id), 'stats'],
    queryFn: () => teamService.getTeamWithStats(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useLeagueTable = (leagueId: string) => {
  return useQuery({
    queryKey: [...teamKeys.list('leagueTable'), leagueId],
    queryFn: () => teamService.getLeagueTable(leagueId),
    enabled: !!leagueId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Mutations
export const useCreateTeam = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: teamService.createTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
    },
  })
}

export const useUpdateTeam = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      teamService.updateTeam(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
      queryClient.invalidateQueries({ queryKey: teamKeys.detail(data.id) })
    },
  })
}

export const useDeleteTeam = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: teamService.deleteTeam,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: teamKeys.lists() })
    },
  })
}

export const useTeamsByCountry = (country: string) => {
  return useQuery({
    queryKey: [...teamKeys.list('by-country'), country],
    queryFn: () => teamService.getTeamsByCountry(country),
    enabled: !!country,
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

export const useAllCountries = () => {
  return useQuery({
    queryKey: teamKeys.list('all-countries'),
    queryFn: teamService.getAllCountries,
    staleTime: 1000 * 60 * 60, // 1 hour for countries list
  })
}