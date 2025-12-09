import { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useSavePageLayout } from "./useSavePageLayout";
import { toast } from "react-toastify";

/**
 * Hook for autosaving page layouts
 * Debounces saves every 5 seconds when isDirty is true
 * Cancels autosave when component unmounts or manual save is in flight
 */
export function useAutosaveLayout(pageId, options = {}) {
  const { debounceMs = 5000, enabled = true, showToasts = false } = options;

  const isDirty = useSelector((state) => state.pageLayouts.isDirty);
  const layouts = useSelector((state) => state.pageLayouts.layouts);
  const lastSavedSnapshot = useSelector(
    (state) => state.pageLayouts.lastSavedSnapshot,
  );

  const { save: saveMutation, isPending: isSaving } = useSavePageLayout();

  const debounceTimerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Set up autosave when isDirty changes
  useEffect(() => {
    // Cancel existing timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only autosave if enabled and dirty
    if (!enabled || !isDirty || !pageId || isSaving) {
      return;
    }

    // Get current layout data
    const currentLayout = layouts[pageId];
    const currentSnapshot = JSON.stringify(currentLayout);

    // Don't save if nothing has changed from last saved snapshot
    if (currentSnapshot === lastSavedSnapshot) {
      return;
    }

    // Set up debounce timer
    debounceTimerRef.current = setTimeout(() => {
      if (!isMountedRef.current) {
        return;
      }

      // Check one more time that we're still dirty
      if (isDirty && currentLayout) {
        if (showToasts) {
          toast.info("Autosaving layout...", {
            position: "bottom-right",
            autoClose: 2000,
            hideProgressBar: true,
          });
        }

        saveMutation({
          pageId,
          layoutPayload: currentLayout,
        });
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [isDirty, pageId, enabled, layouts, lastSavedSnapshot, isSaving]);

  return {
    isSaving,
    hasChanges: isDirty,
  };
}
