import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch, useSelector } from "react-redux";
import { savePageLayout } from "@/services/cms/pageLayouts";
import { markAsSaved, saveError } from "@/features/cms/pageLayoutsSlice";
import { pageLayoutKeys } from "./usePageLayout";
import { toast } from "react-toastify";

/**
 * Hook for saving page layouts
 * Updates Redux state and React Query cache on success
 */
export function useSavePageLayout() {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const isDirty = useSelector((state) => state.pageLayouts.isDirty);

  const mutation = useMutation({
    mutationFn: async ({ pageId, layoutPayload }) => {
      return await savePageLayout(pageId, layoutPayload);
    },
    onSuccess: (data, variables) => {
      const { pageId } = variables;

      // Update Redux store
      dispatch(markAsSaved({ pageId }));

      // Invalidate and refetch the query
      queryClient.invalidateQueries({
        queryKey: pageLayoutKeys.detail(pageId),
      });

      // Show success toast
      toast.success("Layout saved successfully", {
        position: "bottom-right",
        autoClose: 3000,
      });
    },
    onError: (error, variables) => {
      // Update Redux store with error
      const errorMessage = error?.message || "Failed to save layout";
      dispatch(saveError(errorMessage));

      // Show error toast
      toast.error(errorMessage, {
        position: "bottom-right",
        autoClose: 5000,
      });
    },
  });

  return {
    save: mutation.mutate,
    saveAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isError: mutation.isError,
    error: mutation.error,
    isDirty,
  };
}
