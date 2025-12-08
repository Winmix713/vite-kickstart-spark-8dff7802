import { useQuery } from '@tanstack/react-query'
import { playerService } from '@/services/playerService'

// Query keys
export const playerKeys = {
  all: ['players'] as const,
  lists: () => [...playerKeys.all, 'list'] as const,
  list: (filters: string) => [...playerKeys.lists(), { filters }] as const,
  details: () => [...playerKeys.all, 'detail'] as const,
  detail: (id: string) => [...playerKeys.details(), id] as const,
}

// Hooks for players
export const usePlayersByTeam = (teamId: string) => {
  return useQuery({
    queryKey: playerKeys.list(`team-${teamId}`),
    queryFn: () => playerService.getPlayersByTeam(teamId),
    enabled: !!teamId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useAllPlayers = () => {
  return useQuery({
    queryKey: playerKeys.list('all'),
    queryFn: playerService.getAllPlayers,
    staleTime: 1000 * 60 * 15, // 15 minutes
  })
}

export const usePlayer = (id: string) => {
  return useQuery({
    queryKey: playerKeys.detail(id),
    queryFn: () => playerService.getPlayerById(id),
    enabled: !!id,
  })
}