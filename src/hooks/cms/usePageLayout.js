import { useQuery } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import { loadPageLayout } from "@/services/cms/pageLayouts";
import {
  loadLayoutSuccess,
  loadLayoutError,
  loadLayoutPending,
} from "@/features/cms/pageLayoutsSlice";

// Query keys for caching
export const pageLayoutKeys = {
  all: ["pageLayouts"],
  detail: (id) => [...pageLayoutKeys.all, "detail", id],
};

/**
 * Hook to load and manage page layouts
 * Automatically syncs with Redux store
 */
export function usePageLayout(pageId, options = {}) {
  const dispatch = useDispatch();

  const query = useQuery({
    queryKey: pageLayoutKeys.detail(pageId),
    queryFn: () => loadPageLayout(pageId),
    enabled: !!pageId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onSuccess: (data) => {
      if (data) {
        // Extract just the layout JSON
        const layoutData = data.layout_json || { instances: {}, layout: [] };
        dispatch(
          loadLayoutSuccess({
            pageId,
            layoutData,
          }),
        );
      }
    },
    onError: (error) => {
      dispatch(loadLayoutError(error.message));
    },
    ...options,
  });

  return {
    data: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
