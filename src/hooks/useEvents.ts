import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { eventService } from '@/services/eventService'

// Query keys
export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (filters: string) => [...eventKeys.lists(), { filters }] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
}

// Hooks for events
export const useAllEvents = () => {
  return useQuery({
    queryKey: eventKeys.list('all'),
    queryFn: eventService.getAllEvents,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useEventsByDateRange = (startDate: string, endDate: string) => {
  return useQuery({
    queryKey: eventKeys.list(`date-range-${startDate}-${endDate}`),
    queryFn: () => eventService.getEventsByDateRange(startDate, endDate),
    enabled: !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

export const useEvent = (id: string) => {
  return useQuery({
    queryKey: eventKeys.detail(id),
    queryFn: () => eventService.getEventById(id),
    enabled: !!id,
  })
}

// Mutations
export const useCreateEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: eventService.createEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
    },
  })
}

export const useUpdateEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      eventService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
    },
  })
}

export const useDeleteEvent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: eventService.deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: eventKeys.lists() })
    },
  })
}