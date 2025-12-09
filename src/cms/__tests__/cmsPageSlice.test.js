import { describe, it, expect } from 'vitest';
import cmsPageReducer, {
  setCurrentPage,
  initializePageOverrides,
  setPageThemeMode,
  setPageThemeVariant,
  setWidgetVariant,
  setColorOverride,
  removeColorOverride,
  setSpacingOverride,
  setPageThemeOverrides,
  markPageDirty,
  clearPageOverrides,
  resetPageData,
  selectPageThemeMode,
  selectPageThemeVariant,
  selectWidgetVariant,
  selectColorOverrides,
  selectSpacingOverrides,
} from '../../features/cms/cmsPageSlice';

describe('CMS Page Slice', () => {
  const initialState = {
    currentPageId: null,
    pages: {},
    loading: false,
    error: null,
  };

  describe('setCurrentPage', () => {
    it('should set the current page ID', () => {
      const pageId = 'page-123';
      const action = setCurrentPage(pageId);
      const state = cmsPageReducer(initialState, action);

      expect(state.currentPageId).toBe('page-123');
    });
  });

  describe('initializePageOverrides', () => {
    it('should initialize page overrides with defaults', () => {
      const pageId = 'page-1';
      const action = initializePageOverrides({
        pageId,
        defaults: {
          themeMode: 'dark',
          themeVariant: 'glass',
        },
      });
      const state = cmsPageReducer(initialState, action);

      expect(state.pages[pageId]).toBeDefined();
      expect(state.pages[pageId].themeMode).toBe('dark');
      expect(state.pages[pageId].themeVariant).toBe('glass');
    });

    it('should use default values if not provided', () => {
      const pageId = 'page-1';
      const action = initializePageOverrides({
        pageId,
        defaults: {},
      });
      const state = cmsPageReducer(initialState, action);

      expect(state.pages[pageId].themeMode).toBe('light');
      expect(state.pages[pageId].themeVariant).toBe('default');
    });
  });

  describe('setPageThemeMode', () => {
    it('should set the page theme mode', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      const action = setPageThemeMode({ pageId, mode: 'dark' });
      state = cmsPageReducer(state, action);

      expect(state.pages[pageId].themeMode).toBe('dark');
    });

    it('should create page entry if it does not exist', () => {
      const pageId = 'page-new';
      const action = setPageThemeMode({ pageId, mode: 'dark' });
      const state = cmsPageReducer(initialState, action);

      expect(state.pages[pageId]).toBeDefined();
      expect(state.pages[pageId].themeMode).toBe('dark');
    });
  });

  describe('setPageThemeVariant', () => {
    it('should set the page theme variant', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      const action = setPageThemeVariant({ pageId, variant: 'emerald' });
      state = cmsPageReducer(state, action);

      expect(state.pages[pageId].themeVariant).toBe('emerald');
    });
  });

  describe('setWidgetVariant', () => {
    it('should set widget variant for a specific instance', () => {
      const pageId = 'page-1';
      const widgetInstanceId = 'widget-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      const action = setWidgetVariant({
        pageId,
        widgetInstanceId,
        variant: 'compact',
      });
      state = cmsPageReducer(state, action);

      expect(state.pages[pageId].widgetVariants[widgetInstanceId]).toBe('compact');
    });

    it('should handle multiple widget variants on the same page', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      const action1 = setWidgetVariant({
        pageId,
        widgetInstanceId: 'widget-1',
        variant: 'compact',
      });
      state = cmsPageReducer(state, action1);

      const action2 = setWidgetVariant({
        pageId,
        widgetInstanceId: 'widget-2',
        variant: 'minimal',
      });
      state = cmsPageReducer(state, action2);

      expect(state.pages[pageId].widgetVariants['widget-1']).toBe('compact');
      expect(state.pages[pageId].widgetVariants['widget-2']).toBe('minimal');
    });
  });

  describe('setColorOverride', () => {
    it('should set a color override', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      const action = setColorOverride({
        pageId,
        colorKey: 'primary',
        colorValue: '#FF0000',
      });
      state = cmsPageReducer(state, action);

      expect(state.pages[pageId].colorOverrides['primary']).toBe('#FF0000');
    });
  });

  describe('removeColorOverride', () => {
    it('should remove a color override', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      // First set a color override
      let action = setColorOverride({
        pageId,
        colorKey: 'primary',
        colorValue: '#FF0000',
      });
      state = cmsPageReducer(state, action);
      expect(state.pages[pageId].colorOverrides['primary']).toBe('#FF0000');

      // Then remove it
      action = removeColorOverride({ pageId, colorKey: 'primary' });
      state = cmsPageReducer(state, action);
      expect(state.pages[pageId].colorOverrides['primary']).toBeUndefined();
    });
  });

  describe('setSpacingOverride', () => {
    it('should set a spacing override', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      const action = setSpacingOverride({
        pageId,
        spacingKey: '4',
        spacingValue: '2rem',
      });
      state = cmsPageReducer(state, action);

      expect(state.pages[pageId].spacingOverrides['4']).toBe('2rem');
    });
  });

  describe('setPageThemeOverrides', () => {
    it('should merge all theme overrides at once', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      const action = setPageThemeOverrides({
        pageId,
        overrides: {
          themeMode: 'dark',
          themeVariant: 'glass',
          colorOverrides: { primary: '#FF0000' },
        },
      });
      state = cmsPageReducer(state, action);

      expect(state.pages[pageId].themeMode).toBe('dark');
      expect(state.pages[pageId].themeVariant).toBe('glass');
      expect(state.pages[pageId].colorOverrides.primary).toBe('#FF0000');
    });
  });

  describe('markPageDirty', () => {
    it('should mark page as dirty', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      const action = markPageDirty(pageId);
      state = cmsPageReducer(state, action);

      expect(state.pages[pageId]._isDirty).toBe(true);
    });
  });

  describe('clearPageOverrides', () => {
    it('should clear all page overrides', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({
        pageId,
        defaults: {
          themeMode: 'dark',
          themeVariant: 'glass',
          colorOverrides: { primary: '#FF0000' },
        },
      }));
      
      const action = clearPageOverrides(pageId);
      state = cmsPageReducer(state, action);

      expect(state.pages[pageId].themeMode).toBe('light');
      expect(state.pages[pageId].themeVariant).toBe('default');
      expect(Object.keys(state.pages[pageId].colorOverrides)).toHaveLength(0);
    });
  });

  describe('resetPageData', () => {
    it('should delete page data entirely', () => {
      const pageId = 'page-1';
      let state = cmsPageReducer(initialState, initializePageOverrides({ pageId, defaults: {} }));
      
      expect(state.pages[pageId]).toBeDefined();

      const action = resetPageData(pageId);
      state = cmsPageReducer(state, action);

      expect(state.pages[pageId]).toBeUndefined();
    });
  });

  describe('Selectors', () => {
    let state;

    beforeEach(() => {
      state = cmsPageReducer(initialState, setCurrentPage('page-1'));
      state = cmsPageReducer(state, initializePageOverrides({
        pageId: 'page-1',
        defaults: {
          themeMode: 'dark',
          themeVariant: 'emerald',
        },
      }));
      state = cmsPageReducer(state, setColorOverride({
        pageId: 'page-1',
        colorKey: 'primary',
        colorValue: '#FF0000',
      }));
    });

    it('selectPageThemeMode should return page theme mode', () => {
      const mode = selectPageThemeMode(state, 'page-1');
      expect(mode).toBe('dark');
    });

    it('selectPageThemeVariant should return page theme variant', () => {
      const variant = selectPageThemeVariant(state, 'page-1');
      expect(variant).toBe('emerald');
    });

    it('selectWidgetVariant should return widget variant', () => {
      // First set a widget variant
      let newState = cmsPageReducer(state, setWidgetVariant({
        pageId: 'page-1',
        widgetInstanceId: 'widget-1',
        variant: 'compact',
      }));

      const variant = selectWidgetVariant(newState, 'page-1', 'widget-1');
      expect(variant).toBe('compact');
    });

    it('selectWidgetVariant should return default if not set', () => {
      const variant = selectWidgetVariant(state, 'page-1', 'widget-nonexistent');
      expect(variant).toBe('default');
    });

    it('selectColorOverrides should return color overrides', () => {
      const overrides = selectColorOverrides(state, 'page-1');
      expect(overrides.primary).toBe('#FF0000');
    });
  });
});
