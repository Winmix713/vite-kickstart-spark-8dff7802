import { describe, it, expect } from 'vitest'
import pageLayoutsReducer, {
  setCurrentPageId,
  loadLayoutSuccess,
  loadLayoutError,
  updateLayout,
  markAsSaved,
  saveError,
  resetLayout,
  clearAllLayouts,
} from '@/features/cms/pageLayoutsSlice'

describe('pageLayoutsSlice', () => {
  const initialState = {
    currentPageId: null,
    layouts: {},
    isDirty: false,
    lastSavedSnapshot: null,
    isLoading: false,
    error: null,
    lastSaveTime: null,
  }

  const mockPageId = 'page-123'
  const mockLayoutData = {
    instances: {
      'widget-1': { type: 'TeamStats', title: 'Team Statistics' },
      'widget-2': { type: 'Leaderboard', title: 'Leaderboard' },
    },
    layout: [
      { i: 'widget-1', x: 0, y: 0, w: 6, h: 4 },
      { i: 'widget-2', x: 6, y: 0, w: 6, h: 4 },
    ],
  }

  it('should return initial state', () => {
    const state = pageLayoutsReducer(undefined, { type: 'unknown' })
    expect(state).toEqual(initialState)
  })

  describe('setCurrentPageId', () => {
    it('should set the current page ID', () => {
      const state = pageLayoutsReducer(
        initialState,
        setCurrentPageId(mockPageId)
      )
      expect(state.currentPageId).toBe(mockPageId)
    })
  })

  describe('loadLayoutSuccess', () => {
    it('should load layout data and reset dirty state', () => {
      const state = pageLayoutsReducer(
        initialState,
        loadLayoutSuccess({ pageId: mockPageId, layoutData: mockLayoutData })
      )

      expect(state.layouts[mockPageId]).toEqual(mockLayoutData)
      expect(state.isDirty).toBe(false)
      expect(state.isLoading).toBe(false)
      expect(state.error).toBeNull()
      expect(state.lastSavedSnapshot).toBe(JSON.stringify(mockLayoutData))
    })
  })

  describe('loadLayoutError', () => {
    it('should set error state', () => {
      const errorMsg = 'Failed to load layout'
      const state = pageLayoutsReducer(
        { ...initialState, isLoading: true },
        loadLayoutError(errorMsg)
      )

      expect(state.error).toBe(errorMsg)
      expect(state.isLoading).toBe(false)
    })
  })

  describe('updateLayout', () => {
    it('should update layout and mark as dirty', () => {
      const state = pageLayoutsReducer(
        initialState,
        updateLayout({ pageId: mockPageId, layoutData: mockLayoutData })
      )

      expect(state.layouts[mockPageId]).toEqual(mockLayoutData)
      expect(state.isDirty).toBe(true)
    })
  })

  describe('markAsSaved', () => {
    it('should clear dirty flag and update last save time', () => {
      const stateWithChanges = {
        ...initialState,
        isDirty: true,
        layouts: { [mockPageId]: mockLayoutData },
        lastSavedSnapshot: null,
      }

      const state = pageLayoutsReducer(stateWithChanges, markAsSaved({ pageId: mockPageId }))

      expect(state.isDirty).toBe(false)
      expect(state.lastSaveTime).toBeTruthy()
      expect(state.lastSavedSnapshot).toBe(JSON.stringify(mockLayoutData))
      expect(state.error).toBeNull()
    })
  })

  describe('saveError', () => {
    it('should set error but keep isDirty true', () => {
      const stateWithChanges = {
        ...initialState,
        isDirty: true,
      }

      const errorMsg = 'Save failed'
      const state = pageLayoutsReducer(stateWithChanges, saveError(errorMsg))

      expect(state.error).toBe(errorMsg)
      expect(state.isDirty).toBe(true)
    })
  })

  describe('resetLayout', () => {
    it('should reset layout for a specific page', () => {
      const stateWithLayout = {
        ...initialState,
        layouts: { [mockPageId]: mockLayoutData },
        isDirty: true,
      }

      const state = pageLayoutsReducer(stateWithLayout, resetLayout({ pageId: mockPageId }))

      expect(state.layouts[mockPageId]).toEqual({ instances: {}, layout: [] })
      expect(state.isDirty).toBe(false)
      expect(state.lastSavedSnapshot).toBeNull()
      expect(state.error).toBeNull()
    })
  })

  describe('clearAllLayouts', () => {
    it('should clear all layouts and reset state', () => {
      const stateWithData = {
        ...initialState,
        currentPageId: mockPageId,
        layouts: { [mockPageId]: mockLayoutData },
        isDirty: true,
        lastSavedSnapshot: 'snapshot',
        error: 'some error',
      }

      const state = pageLayoutsReducer(stateWithData, clearAllLayouts())

      expect(state.layouts).toEqual({})
      expect(state.isDirty).toBe(false)
      expect(state.currentPageId).toBeNull()
      expect(state.lastSavedSnapshot).toBeNull()
      expect(state.error).toBeNull()
    })
  })

  describe('multiple page handling', () => {
    it('should handle layouts for multiple pages independently', () => {
      const page1 = 'page-1'
      const page2 = 'page-2'
      const layout1 = { instances: { 'w-1': { type: 'Widget1' } }, layout: [] }
      const layout2 = { instances: { 'w-2': { type: 'Widget2' } }, layout: [] }

      let state = initialState
      state = pageLayoutsReducer(state, loadLayoutSuccess({ pageId: page1, layoutData: layout1 }))
      state = pageLayoutsReducer(state, loadLayoutSuccess({ pageId: page2, layoutData: layout2 }))

      expect(state.layouts[page1]).toEqual(layout1)
      expect(state.layouts[page2]).toEqual(layout2)
    })
  })

  describe('dirty state transitions', () => {
    it('should track dirty state correctly through save cycle', () => {
      let state = initialState

      // Load layout
      state = pageLayoutsReducer(
        state,
        loadLayoutSuccess({ pageId: mockPageId, layoutData: mockLayoutData })
      )
      expect(state.isDirty).toBe(false)

      // Update layout
      const updatedLayout = {
        ...mockLayoutData,
        instances: { ...mockLayoutData.instances, 'widget-3': { type: 'Widget3' } },
      }
      state = pageLayoutsReducer(
        state,
        updateLayout({ pageId: mockPageId, layoutData: updatedLayout })
      )
      expect(state.isDirty).toBe(true)

      // Mark as saved
      state = pageLayoutsReducer(state, markAsSaved({ pageId: mockPageId }))
      expect(state.isDirty).toBe(false)
    })
  })
})
