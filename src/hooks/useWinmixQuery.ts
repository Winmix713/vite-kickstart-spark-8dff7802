import { useQuery } from '@tanstack/react-query'

// Generic hook for wrapping API calls with React Query
export const useWinmixQuery = <T>(
  queryKey: string[],
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean
    staleTime?: number
    refetchInterval?: number
    retry?: number
  } = {}
) => {
  return useQuery({
    queryKey,
    queryFn,
    enabled: options.enabled ?? true,
    staleTime: options.staleTime ?? 1000 * 60 * 5, // 5 minutes default
    refetchInterval: options.refetchInterval,
    retry: options.retry ?? 3,
  })
}

// Helper for creating skeleton/loading states
export const createLoadingState = (count: number, template: any) => {
  return Array.from({ length: count }, () => template)
}

// Helper for handling empty states
export const useDataWithFallback = <T>(
  data: T | undefined,
  fallback: T,
  isLoading: boolean,
  error: any
) => {
  if (isLoading) return undefined
  if (error) return fallback
  if (!data || (Array.isArray(data) && data.length === 0)) return fallback
  return data
}