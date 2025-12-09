import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { leagueService } from '@/services/leagueService'

// Query keys
export const leagueKeys = {
  all: ['leagues'] as const,
  lists: () => [...leagueKeys.all, 'list'] as const,
  list: (filters: string) => [...leagueKeys.lists(), { filters }] as const,
  details: () => [...leagueKeys.all, 'detail'] as const,
  detail: (id: string) => [...leagueKeys.details(), id] as const,
}

// Hooks for leagues
export const useAllLeagues = () => {
  return useQuery({
    queryKey: leagueKeys.list('all'),
    queryFn: leagueService.getAllLeagues,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useActiveLeagues = () => {
  return useQuery({
    queryKey: leagueKeys.list('active'),
    queryFn: leagueService.getActiveLeagues,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useLeague = (id: string) => {
  return useQuery({
    queryKey: leagueKeys.detail(id),
    queryFn: () => leagueService.getLeagueById(id),
    enabled: !!id,
  })
}

export const useLeaguesByCountry = (country: string) => {
  return useQuery({
    queryKey: [...leagueKeys.list('byCountry'), country],
    queryFn: () => leagueService.getLeaguesByCountry(country),
    enabled: !!country,
  })
}

// Mutations
export const useCreateLeague = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: leagueService.createLeague,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() })
    },
  })
}

export const useUpdateLeague = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      leagueService.updateLeague(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leagueKeys.detail(data.id) })
    },
  })
}

export const useDeleteLeague = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: leagueService.deleteLeague,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() })
    },
  })
}

export const useToggleLeagueStatus = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => 
      leagueService.toggleLeagueStatus(id, isActive),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: leagueKeys.lists() })
      queryClient.invalidateQueries({ queryKey: leagueKeys.detail(data.id) })
    },
  })
}