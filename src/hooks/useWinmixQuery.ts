/**
 * useWinmixQuery - Reusable hook for WinMix API data fetching
 * 
 * Provides a consistent interface for calling WinMix API helpers with:
 * - Loading and error states
 * - Memoized selectors for optimized performance
 * - Cache management
 * - Tree-shakeable and compatible with Suspense/Skeletons
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { winmixApi } from '../services/winmixApi'
import { useMemo } from 'react'

// Type definitions for API methods
type WinmixApiMethod = keyof typeof winmixApi
type WinmixApiReturnType<T extends WinmixApiMethod> = Awaited<ReturnType<typeof winmixApi[T]>>

// Query key factory for consistent cache management
export const winmixQueryKeys = {
  all: ['winmix'] as const,
  
  // Data types
  standings: (leagueId: string) => [...winmixQueryKeys.all, 'standings', leagueId] as const,
  liveMatches: () => [...winmixQueryKeys.all, 'liveMatches'] as const,
  finishedMatches: () => [...winmixQueryKeys.all, 'finishedMatches'] as const,
  playerProfile: (playerId: string) => [...winmixQueryKeys.all, 'playerProfile', playerId] as const,
  storeInventory: (category?: string) => [...winmixQueryKeys.all, 'storeInventory', category] as const,
  chatMessages: (conversationId?: string) => [...winmixQueryKeys.all, 'chatMessages', conversationId] as const,
  schedule: (type?: string) => [...winmixQueryKeys.all, 'schedule', type] as const,
  predictions: () => [...winmixQueryKeys.all, 'predictions'] as const,
  todos: () => [...winmixQueryKeys.all, 'todos'] as const,
  systemStatus: () => [...winmixQueryKeys.all, 'systemStatus'] as const,
  teamAnalytics: (teamId: string) => [...winmixQueryKeys.all, 'teamAnalytics', teamId] as const,
}

// Generic hook for any WinMix API method
export function useWinmixQuery<
  T extends WinmixApiMethod
>(
  method: T,
  params: Parameters<typeof winmixApi[T]>,
  options?: {
    enabled?: boolean
    staleTime?: number
    refetchInterval?: number | false
    cacheTime?: number
  }
): {
  data: WinmixApiReturnType<T> | undefined
  isLoading: boolean
  error: Error | null
  refetch: () => void
  isRefetching: boolean
} {
  const queryKey = useMemo(() => {
    // Generate query key based on method and params
    switch (method) {
      case 'fetchLeagueStandings':
        return winmixQueryKeys.standings(params[0])
      case 'fetchLiveMatches':
        return winmixQueryKeys.liveMatches()
      case 'fetchFinishedMatches':
        return winmixQueryKeys.finishedMatches()
      case 'fetchPlayerProfile':
        return winmixQueryKeys.playerProfile(params[0])
      case 'fetchStoreInventory':
        return winmixQueryKeys.storeInventory(params[0])
      case 'fetchChatMessages':
        return winmixQueryKeys.chatMessages(params[0])
      case 'fetchSchedule':
        return winmixQueryKeys.schedule(params[0])
      case 'fetchPredictions':
        return winmixQueryKeys.predictions()
      case 'fetchTodos':
        return winmixQueryKeys.todos()
      case 'fetchSystemStatus':
        return winmixQueryKeys.systemStatus()
      case 'fetchTeamAnalytics':
        return winmixQueryKeys.teamAnalytics(params[0])
      default:
        return winmixQueryKeys.all
    }
  }, [method, params])

  const queryFn = useMemo(() => {
    return () => (winmixApi as any)[method](...params)
  }, [method, params])

  const query = useQuery({
    queryKey,
    queryFn,
    enabled: options?.enabled !== false,
    staleTime: options?.staleTime ?? getDefaultStaleTime(method),
    refetchInterval: options?.refetchInterval ?? getDefaultRefetchInterval(method),
    gcTime: options?.cacheTime ?? getDefaultCacheTime(method),
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.status >= 400 && error?.status < 500) return false
      return failureCount < 3
    },
  })

  return query
}

// Specialized hooks for common data types

// ===== LEAGUE STANDINGS =====
export function useLeagueStandings(leagueId: string, options?: {
  enabled?: boolean
  staleTime?: number
}) {
  return useWinmixQuery('fetchLeagueStandings', [leagueId], {
    staleTime: options?.staleTime ?? 1000 * 60 * 10, // 10 minutes
    enabled: options?.enabled !== false && !!leagueId
  })
}

// ===== MATCHES =====
export function useLiveMatches(options?: {
  enabled?: boolean
  refetchInterval?: number | false
}) {
  return useWinmixQuery('fetchLiveMatches', [], {
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: options?.refetchInterval ?? 30000, // 30 seconds for live
    enabled: options?.enabled !== false
  })
}

export function useFinishedMatches(limit = 50, options?: {
  enabled?: boolean
  staleTime?: number
}) {
  return useWinmixQuery('fetchFinishedMatches', [limit], {
    staleTime: options?.staleTime ?? 1000 * 60 * 10, // 10 minutes
    enabled: options?.enabled !== false
  })
}

// ===== PLAYER DATA =====
export function usePlayerProfile(playerId: string, options?: {
  enabled?: boolean
  staleTime?: number
}) {
  return useWinmixQuery('fetchPlayerProfile', [playerId], {
    staleTime: options?.staleTime ?? 1000 * 60 * 15, // 15 minutes
    enabled: options?.enabled !== false && !!playerId
  })
}

// ===== STORE DATA =====
export function useStoreInventory(category?: string, options?: {
  enabled?: boolean
  staleTime?: number
}) {
  return useWinmixQuery('fetchStoreInventory', [category], {
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled !== false
  })
}

// ===== CHAT MESSAGES =====
export function useChatMessages(conversationId?: string, options?: {
  enabled?: boolean
  staleTime?: number
  refetchInterval?: number | false
}) {
  return useWinmixQuery('fetchChatMessages', [conversationId], {
    staleTime: options?.staleTime ?? 1000 * 30, // 30 seconds
    refetchInterval: options?.refetchInterval ?? 10000, // 10 seconds for chat
    enabled: options?.enabled !== false
  })
}

// ===== SCHEDULE =====
export function useSchedule(type?: 'training' | 'match' | 'meeting' | 'event', options?: {
  enabled?: boolean
  staleTime?: number
}) {
  return useWinmixQuery('fetchSchedule', [type], {
    staleTime: options?.staleTime ?? 1000 * 60 * 30, // 30 minutes
    enabled: options?.enabled !== false
  })
}

// ===== PREDICTIONS =====
export function usePredictions(limit = 20, options?: {
  enabled?: boolean
  staleTime?: number
}) {
  return useWinmixQuery('fetchPredictions', [limit], {
    staleTime: options?.staleTime ?? 1000 * 60 * 5, // 5 minutes
    enabled: options?.enabled !== false
  })
}

// ===== TODOS =====
export function useTodos(options?: {
  enabled?: boolean
  staleTime?: number
}) {
  return useWinmixQuery('fetchTodos', [], {
    staleTime: options?.staleTime ?? 1000 * 60 * 2, // 2 minutes
    enabled: options?.enabled !== false
  })
}

// ===== SYSTEM STATUS =====
export function useSystemStatus(options?: {
  enabled?: boolean
  refetchInterval?: number | false
}) {
  return useWinmixQuery('fetchSystemStatus', [], {
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: options?.refetchInterval ?? 60000, // 1 minute for system status
    enabled: options?.enabled !== false
  })
}

// ===== TEAM ANALYTICS =====
export function useTeamAnalytics(teamId: string, options?: {
  enabled?: boolean
  staleTime?: number
}) {
  return useWinmixQuery('fetchTeamAnalytics', [teamId], {
    staleTime: options?.staleTime ?? 1000 * 60 * 10, // 10 minutes
    enabled: options?.enabled !== false && !!teamId
  })
}

// Memoized selector hooks for data transformations
export function useLeagueStandingsSelector(
  standings: ReturnType<typeof useLeagueStandings>['data'],
  selector: (data: any) => any
) {
  return useMemo(() => {
    return selector?.(standings)
  }, [standings, selector])
}

export function useMatchSelector(
  matches: ReturnType<typeof useLiveMatches>['data'],
  selector: (data: any) => any
) {
  return useMemo(() => {
    return selector?.(matches)
  }, [matches, selector])
}

export function usePlayerSelector(
  player: ReturnType<typeof usePlayerProfile>['data'],
  selector: (data: any) => any
) {
  return useMemo(() => {
    return selector?.(player)
  }, [player, selector])
}

// ===== MUTATION HOOKS =====

// Generic mutation hook
export function useWinmixMutation<
  T extends (...args: any[]) => Promise<any>
>(
  mutationFn: T,
  options?: {
    onSuccess?: (data: Awaited<ReturnType<T>>) => void
    onError?: (error: Error) => void
    invalidateQueries?: string[]
  }
) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      options?.onSuccess?.(data)
      
      // Invalidate related queries
      if (options?.invalidateQueries) {
        options.invalidateQueries.forEach(queryKey => {
          queryClient.invalidateQueries({ queryKey: queryKey.startsWith('[') ? JSON.parse(queryKey) : [queryKey] })
        })
      }
    },
    onError: (error) => {
      options?.onError?.(error as Error)
    },
  })
}

// ===== HELPER FUNCTIONS =====

// Default stale times based on data type
function getDefaultStaleTime(method: WinmixApiMethod): number {
  const staleTimes: Record<WinmixApiMethod, number> = {
    fetchLeagueStandings: 1000 * 60 * 10, // 10 minutes
    fetchLiveMatches: 1000 * 60 * 2,      // 2 minutes
    fetchFinishedMatches: 1000 * 60 * 10, // 10 minutes
    fetchPlayerProfile: 1000 * 60 * 15,   // 15 minutes
    fetchStoreInventory: 1000 * 60 * 5,   // 5 minutes
    fetchChatMessages: 1000 * 30,         // 30 seconds
    fetchSchedule: 1000 * 60 * 30,        // 30 minutes
    fetchPredictions: 1000 * 60 * 5,      // 5 minutes
    fetchTodos: 1000 * 60 * 2,            // 2 minutes
    fetchSystemStatus: 1000 * 60,         // 1 minute
    fetchTeamAnalytics: 1000 * 60 * 10,   // 10 minutes
  }
  
  return staleTimes[method] ?? 1000 * 60 * 5 // Default 5 minutes
}

// Default refetch intervals for real-time data
function getDefaultRefetchInterval(method: WinmixApiMethod): number | false {
  const refetchIntervals: Record<WinmixApiMethod, number | false> = {
    fetchLeagueStandings: false,           // No auto-refetch
    fetchLiveMatches: 30000,               // 30 seconds
    fetchFinishedMatches: false,           // No auto-refetch
    fetchPlayerProfile: false,             // No auto-refetch
    fetchStoreInventory: false,            // No auto-refetch
    fetchChatMessages: 10000,              // 10 seconds
    fetchSchedule: false,                  // No auto-refetch
    fetchPredictions: 60000,               // 1 minute
    fetchTodos: false,                     // No auto-refetch
    fetchSystemStatus: 60000,              // 1 minute
    fetchTeamAnalytics: false,             // No auto-refetch
  }
  
  return refetchIntervals[method] ?? false
}

// Default cache times for query client
function getDefaultCacheTime(method: WinmixApiMethod): number {
  return 1000 * 60 * 5 // 5 minutes default
}

// Utility for optimistic updates
export function useOptimisticUpdate(
  queryKey: any[],
  updateFn: (oldData: any) => any
) {
  const queryClient = useQueryClient()

  const optimisticUpdate = async (data: any) => {
    // Cancel any outgoing refetches
    await queryClient.cancelQueries({ queryKey })

    // Snapshot the previous value
    const previousData = queryClient.getQueryData(queryKey)

    // Optimistically update to the new value
    queryClient.setQueryData(queryKey, (old: any) => updateFn(old))

    // Return a context object with the snapshotted value
    return { previousData }
  }

  const rollback = async (context: { previousData: any }) => {
    queryClient.setQueryData(queryKey, context.previousData)
  }

  return { optimisticUpdate, rollback }
}

export default useWinmixQuery