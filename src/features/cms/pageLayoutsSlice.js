import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  // Current page being edited
  currentPageId: null,

  // Layout data structure: { [pageId]: { instances: {}, layout: [] } }
  layouts: {},

  // Track if current layout has unsaved changes
  isDirty: false,

  // Last saved snapshot for comparison
  lastSavedSnapshot: null,

  // UI state
  isLoading: false,
  error: null,
  lastSaveTime: null,
};

export const PageLayouts = createSlice({
  name: "pageLayouts",
  initialState,
  reducers: {
    // Set the current page being edited
    setCurrentPageId: (state, action) => {
      state.currentPageId = action.payload;
    },

    // Load layout data from Supabase
    loadLayoutSuccess: (state, action) => {
      const { pageId, layoutData } = action.payload;
      state.layouts[pageId] = layoutData;
      state.isDirty = false;
      state.lastSavedSnapshot = JSON.stringify(layoutData);
      state.isLoading = false;
      state.error = null;
    },

    // Load layout error
    loadLayoutError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },

    // Load layout pending
    loadLayoutPending: (state) => {
      state.isLoading = true;
      state.error = null;
    },

    // Update layout instances (the actual widget configuration)
    updateLayoutInstances: (state, action) => {
      const { pageId, instances } = action.payload;
      if (!state.layouts[pageId]) {
        state.layouts[pageId] = { instances: {}, layout: [] };
      }
      state.layouts[pageId].instances = instances;
      state.isDirty = true;
    },

    // Update layout grid configuration
    updateLayoutGrid: (state, action) => {
      const { pageId, layout } = action.payload;
      if (!state.layouts[pageId]) {
        state.layouts[pageId] = { instances: {}, layout: [] };
      }
      state.layouts[pageId].layout = layout;
      state.isDirty = true;
    },

    // Bulk update layout data
    updateLayout: (state, action) => {
      const { pageId, layoutData } = action.payload;
      state.layouts[pageId] = layoutData;
      state.isDirty = true;
    },

    // Mark as saved
    markAsSaved: (state, action) => {
      const { pageId } = action.payload;
      state.isDirty = false;
      state.lastSaveTime = new Date().toISOString();
      state.lastSavedSnapshot = JSON.stringify(state.layouts[pageId]);
      state.error = null;
    },

    // Mark save as failed
    saveError: (state, action) => {
      state.error = action.payload;
      // Keep isDirty true so we can retry
    },

    // Reset layout for a page
    resetLayout: (state, action) => {
      const { pageId } = action.payload;
      state.layouts[pageId] = { instances: {}, layout: [] };
      state.isDirty = false;
      state.lastSavedSnapshot = null;
      state.error = null;
    },

    // Clear all layouts
    clearAllLayouts: (state) => {
      state.layouts = {};
      state.isDirty = false;
      state.lastSavedSnapshot = null;
      state.error = null;
      state.currentPageId = null;
    },
  },
});

export const {
  setCurrentPageId,
  loadLayoutSuccess,
  loadLayoutError,
  loadLayoutPending,
  updateLayoutInstances,
  updateLayoutGrid,
  updateLayout,
  markAsSaved,
  saveError,
  resetLayout,
  clearAllLayouts,
} = PageLayouts.actions;

export default PageLayouts.reducer;
