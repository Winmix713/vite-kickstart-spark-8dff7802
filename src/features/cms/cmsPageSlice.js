import { createSlice } from "@reduxjs/toolkit";

/**
 * CMS Page Slice - manages theme overrides and widget variants for pages
 */
const initialState = {
  currentPageId: null,
  pages: {}, // { pageId: { themeMode, themeVariant, widgetVariants, colorOverrides } }
  loading: false,
  error: null,
};

const cmsPageSlice = createSlice({
  name: "cmsPage",
  initialState,
  reducers: {
    // Set current page ID
    setCurrentPage: (state, action) => {
      state.currentPageId = action.payload;
    },

    // Initialize page overrides
    initializePageOverrides: (state, action) => {
      const { pageId, defaults } = action.payload;
      if (!state.pages[pageId]) {
        state.pages[pageId] = {
          themeMode: defaults?.themeMode || "light",
          themeVariant: defaults?.themeVariant || "default",
          widgetVariants: defaults?.widgetVariants || {},
          colorOverrides: defaults?.colorOverrides || {},
          spacingOverrides: defaults?.spacingOverrides || {},
          ...defaults,
        };
      }
    },

    // Set page theme mode (light/dark)
    setPageThemeMode: (state, action) => {
      const { pageId, mode } = action.payload;
      if (!state.pages[pageId]) {
        state.pages[pageId] = {};
      }
      state.pages[pageId].themeMode = mode;
    },

    // Set page theme variant
    setPageThemeVariant: (state, action) => {
      const { pageId, variant } = action.payload;
      if (!state.pages[pageId]) {
        state.pages[pageId] = {};
      }
      state.pages[pageId].themeVariant = variant;
    },

    // Set widget variant for a specific widget instance
    setWidgetVariant: (state, action) => {
      const { pageId, widgetInstanceId, variant } = action.payload;
      if (!state.pages[pageId]) {
        state.pages[pageId] = { widgetVariants: {} };
      }
      if (!state.pages[pageId].widgetVariants) {
        state.pages[pageId].widgetVariants = {};
      }
      state.pages[pageId].widgetVariants[widgetInstanceId] = variant;
    },

    // Set color override
    setColorOverride: (state, action) => {
      const { pageId, colorKey, colorValue } = action.payload;
      if (!state.pages[pageId]) {
        state.pages[pageId] = { colorOverrides: {} };
      }
      if (!state.pages[pageId].colorOverrides) {
        state.pages[pageId].colorOverrides = {};
      }
      state.pages[pageId].colorOverrides[colorKey] = colorValue;
    },

    // Remove color override
    removeColorOverride: (state, action) => {
      const { pageId, colorKey } = action.payload;
      if (state.pages[pageId]?.colorOverrides) {
        delete state.pages[pageId].colorOverrides[colorKey];
      }
    },

    // Set spacing override
    setSpacingOverride: (state, action) => {
      const { pageId, spacingKey, spacingValue } = action.payload;
      if (!state.pages[pageId]) {
        state.pages[pageId] = { spacingOverrides: {} };
      }
      if (!state.pages[pageId].spacingOverrides) {
        state.pages[pageId].spacingOverrides = {};
      }
      state.pages[pageId].spacingOverrides[spacingKey] = spacingValue;
    },

    // Set all theme overrides at once
    setPageThemeOverrides: (state, action) => {
      const { pageId, overrides } = action.payload;
      if (!state.pages[pageId]) {
        state.pages[pageId] = {};
      }
      state.pages[pageId] = {
        ...state.pages[pageId],
        ...overrides,
      };
    },

    // Load page overrides from API
    loadPageOverridesStart: (state) => {
      state.loading = true;
      state.error = null;
    },

    loadPageOverridesSuccess: (state, action) => {
      const { pageId, overrides } = action.payload;
      state.pages[pageId] = overrides;
      state.loading = false;
    },

    loadPageOverridesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },

    // Save page overrides (mark as dirty for sync)
    markPageDirty: (state, action) => {
      const pageId = action.payload;
      if (!state.pages[pageId]) {
        state.pages[pageId] = {};
      }
      state.pages[pageId]._isDirty = true;
    },

    // Clear page overrides
    clearPageOverrides: (state, action) => {
      const pageId = action.payload;
      if (state.pages[pageId]) {
        state.pages[pageId] = {
          themeMode: "light",
          themeVariant: "default",
          widgetVariants: {},
          colorOverrides: {},
          spacingOverrides: {},
        };
      }
    },

    // Reset entire page data
    resetPageData: (state, action) => {
      const pageId = action.payload;
      delete state.pages[pageId];
    },
  },
});

// Selectors
export const selectCurrentPageId = (state) => state.cmsPage?.currentPageId;
export const selectPageOverrides = (state, pageId) =>
  state.cmsPage?.pages[pageId] || null;
export const selectPageThemeMode = (state, pageId) =>
  state.cmsPage?.pages[pageId]?.themeMode || "light";
export const selectPageThemeVariant = (state, pageId) =>
  state.cmsPage?.pages[pageId]?.themeVariant || "default";
export const selectWidgetVariant = (state, pageId, widgetInstanceId) =>
  state.cmsPage?.pages[pageId]?.widgetVariants?.[widgetInstanceId] || "default";
export const selectColorOverrides = (state, pageId) =>
  state.cmsPage?.pages[pageId]?.colorOverrides || {};
export const selectSpacingOverrides = (state, pageId) =>
  state.cmsPage?.pages[pageId]?.spacingOverrides || {};
export const selectPageLoading = (state) => state.cmsPage?.loading || false;
export const selectPageError = (state) => state.cmsPage?.error || null;

export const {
  setCurrentPage,
  initializePageOverrides,
  setPageThemeMode,
  setPageThemeVariant,
  setWidgetVariant,
  setColorOverride,
  removeColorOverride,
  setSpacingOverride,
  setPageThemeOverrides,
  loadPageOverridesStart,
  loadPageOverridesSuccess,
  loadPageOverridesFailure,
  markPageDirty,
  clearPageOverrides,
  resetPageData,
} = cmsPageSlice.actions;

export default cmsPageSlice.reducer;
