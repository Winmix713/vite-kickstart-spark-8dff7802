import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { callEdgeFunction, ApiResponse } from '@/lib/apiClient';
import { useToast } from '@/hooks/use-toast';

// Generic query options for edge functions
export interface UseEdgeFunctionQueryOptions<T = unknown> extends Omit<UseQueryOptions<ApiResponse<T>>, 'queryFn' | 'queryKey'> {
  functionName: string;
  options?: Parameters<typeof callEdgeFunction>[1];
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

// Generic mutation options for edge functions
export interface UseEdgeFunctionMutationOptions<T = unknown, V = unknown> extends Omit<UseMutationOptions<ApiResponse<T>, Error, V>, 'mutationFn'> {
  functionName: string;
  options?: Parameters<typeof callEdgeFunction>[1];
  onSuccess?: (data: T) => void;
  onError?: (error: string) => void;
}

/**
 * Hook for calling edge functions with React Query integration
 */
export function useEdgeFunction<T = unknown>(functionName: string, options: Parameters<typeof callEdgeFunction>[1] = {}) {
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  const mutation = useMutation<ApiResponse<T>, Error, unknown>({
    mutationFn: (variables?: unknown) => {
      return callEdgeFunction<T>(functionName, {
        ...options,
        body: variables || options.body
      });
    },
    onSuccess: result => {
      if (result.success && result.data) {
        // Invalidate related queries to trigger refetch
        queryClient.invalidateQueries({
          queryKey: [functionName]
        });
        toast({
          title: 'Success',
          description: `${functionName} completed successfully`
        });
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    },
    onError: error => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
  return mutation;
}

/**
 * Hook for querying data from edge functions
 */
export function useEdgeFunctionQuery<T = unknown>({
  functionName,
  options,
  onSuccess,
  onError,
  ...queryOptions
}: UseEdgeFunctionQueryOptions<T>) {
  const {
    toast
  } = useToast();
  return useQuery({
    queryKey: [functionName, options],
    queryFn: () => callEdgeFunction<T>(functionName, options),
    ...queryOptions,
    onSuccess: data => {
      if (data.success && data.data) {
        onSuccess?.(data.data);
      } else {
        onError?.(data.error || 'Unknown error');
      }
    },
    onError: error => {
      onError?.(error.message);
      toast({
        title: 'Query Error',
        description: error.message,
        variant: 'destructive'
      });
    },
    select: (data: ApiResponse<T>) => data.success ? data.data : null,
    enabled: queryOptions.enabled !== false && functionName !== undefined
  });
}

/**
 * Hook for mutating data via edge functions
 */
export function useEdgeFunctionMutation<T = unknown, V = unknown>({
  functionName,
  options,
  onSuccess,
  onError,
  ...mutationOptions
}: UseEdgeFunctionMutationOptions<T, V>) {
  const queryClient = useQueryClient();
  const {
    toast
  } = useToast();
  return useMutation<ApiResponse<T>, Error, V>({
    mutationFn: (variables: V) => {
      return callEdgeFunction<T>(functionName, {
        ...options,
        body: variables
      });
    },
    onSuccess: result => {
      if (result.success && result.data) {
        onSuccess?.(result.data);

        // Invalidate related queries
        queryClient.invalidateQueries({
          queryKey: [functionName]
        });
        toast({
          title: 'Success',
          description: `${functionName} completed successfully`
        });
      } else {
        onError?.(result.error || 'Unknown error');
        toast({
          title: 'Error',
          description: result.error || 'Unknown error occurred',
          variant: 'destructive'
        });
      }
    },
    onError: error => {
      onError?.(error.message);
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    },
    ...mutationOptions
  });
}

/**
 * Pre-configured hooks for common edge functions
 */

// Jobs management
export const useJobsList = () => useEdgeFunctionQuery({
  functionName: 'jobs-list',
  options: {
    method: 'GET'
  }
});
export const useJobCreate = () => useEdgeFunctionMutation({
  functionName: 'jobs-create'
});
export const useJobToggle = () => useEdgeFunctionMutation({
  functionName: 'jobs-toggle'
});

// Models management
export const useModelsPerformance = () => useEdgeFunctionQuery({
  functionName: 'models-performance',
  options: {
    method: 'GET'
  }
});
export const useModelCompare = () => useEdgeFunctionMutation({
  functionName: 'models-compare'
});

// Analytics
export const useMonitoringMetrics = () => useEdgeFunctionQuery({
  functionName: 'monitoring-metrics',
  options: {
    method: 'GET'
  }
});
export const useAnalyticsData = () => useEdgeFunctionQuery({
  functionName: 'analytics-data',
  options: {
    method: 'GET'
  }
});

// Phase 9
export const usePhase9CollaborativeIntelligence = () => useEdgeFunctionQuery({
  functionName: 'phase9-collaborative-intelligence',
  options: {
    method: 'GET'
  }
});
export const usePhase9MarketIntegration = () => useEdgeFunctionMutation({
  functionName: 'phase9-market-integration'
});

// Cross-league
export const useCrossLeagueAnalyze = () => useEdgeFunctionMutation({
  functionName: 'cross-league-analyze'
});
export const useCrossLeagueCorrelations = () => useEdgeFunctionQuery({
  functionName: 'cross-league-correlations',
  options: {
    method: 'GET'
  }
});

// Pattern detection
export const usePatternsDetect = () => useEdgeFunctionMutation({
  functionName: 'patterns-detect'
});
export const useMetaPatternsDiscover = () => useEdgeFunctionMutation({
  functionName: 'meta-patterns-discover'
});

// AI Chat
export const useAIChat = () => useEdgeFunctionMutation({
  functionName: 'ai-chat'
});

// Admin functions
export const useAdminModelAnalytics = () => useEdgeFunctionQuery({
  functionName: 'admin-model-analytics',
  options: {
    method: 'GET'
  }
});
export const useAdminModelTriggerTraining = () => useEdgeFunctionMutation({
  functionName: 'admin-model-trigger-training'
});
export const useAdminPredictionReview = () => useEdgeFunctionQuery({
  functionName: 'admin-prediction-review',
  options: {
    method: 'GET'
  }
});

// Prediction Analyzer
export const usePredictionAnalyzer = (params?: {
  metric?: 'accuracy_trends' | 'league_breakdown' | 'confidence_calibration';
  start_date?: string;
  end_date?: string;
  league?: string;
}) => useEdgeFunctionQuery({
  functionName: 'prediction-analyzer',
  options: {
    method: 'GET',
    params: params
  }
});

// Value Ranking for predictions
export const useValueRankedPredictions = (matchIds?: string[]) => useEdgeFunctionQuery({
  functionName: 'get-predictions',
  options: {
    method: 'GET',
    params: {
      value_ranking: 'true',
      match_ids: matchIds?.join(',')
    }
  },
  enabled: matchIds && matchIds.length > 0
});