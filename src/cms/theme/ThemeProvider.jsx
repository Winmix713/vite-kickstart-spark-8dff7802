import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { buildCssVariables, getThemeVariant, themeVariants } from './tokens';

/**
 * CMS Theme Context - separate from the global theme context
 * Provides theme variants and CSS variable injection for the CMS builder/renderer
 */
const CmsThemeContext = createContext(undefined);

export const CmsThemeProvider = ({ children, defaultVariant = 'default', defaultMode = 'light' }) => {
  const rootRef = useRef(null);
  const [currentVariant, setCurrentVariant] = useState(defaultVariant);
  const [mode, setMode] = useState(defaultMode);
  const [pageOverrides, setPageOverrides] = useState({});
  const [widgetVariants, setWidgetVariants] = useState({});

  // Initialize root element reference
  useEffect(() => {
    rootRef.current = document.documentElement;
  }, []);

  // Apply CSS variables when variant or mode changes
  useEffect(() => {
    if (!rootRef.current) return;

    const variant = getThemeVariant(currentVariant);
    if (!variant) {
      console.warn(`Theme variant "${currentVariant}" not found`);
      return;
    }

    // Build CSS variables for the current variant and mode
    const cssVars = buildCssVariables(variant, mode);

    // Apply CSS variables to root
    Object.entries(cssVars).forEach(([key, value]) => {
      rootRef.current.style.setProperty(key, value);
    });

    // Set data attributes for styling
    rootRef.current.setAttribute('data-cms-theme', currentVariant);
    rootRef.current.setAttribute('data-cms-mode', mode);
  }, [currentVariant, mode]);

  // Toggle between light and dark mode
  const toggleMode = useCallback(() => {
    setMode(prev => prev === 'light' ? 'dark' : 'light');
  }, []);

  // Change theme variant
  const changeVariant = useCallback((variantName) => {
    if (themeVariants[variantName]) {
      setCurrentVariant(variantName);
    } else {
      console.warn(`Theme variant "${variantName}" not found`);
    }
  }, []);

  // Set page-level theme overrides
  const setThemeOverrides = useCallback((overrides) => {
    setPageOverrides(overrides);
    
    // Apply overrides to CSS variables
    if (rootRef.current) {
      Object.entries(overrides).forEach(([key, value]) => {
        rootRef.current.style.setProperty(`--cms-override-${key}`, value);
      });
    }
  }, []);

  // Set widget-specific variant
  const setWidgetVariant = useCallback((widgetInstanceId, variantSlug) => {
    setWidgetVariants(prev => ({
      ...prev,
      [widgetInstanceId]: variantSlug,
    }));
  }, []);

  // Get widget variant
  const getWidgetVariant = useCallback((widgetInstanceId) => {
    return widgetVariants[widgetInstanceId] || 'default';
  }, [widgetVariants]);

  // Memoize context value
  const contextValue = useMemo(() => ({
    currentVariant,
    mode,
    pageOverrides,
    widgetVariants,
    toggleMode,
    changeVariant,
    setThemeOverrides,
    setWidgetVariant,
    getWidgetVariant,
    isDark: mode === 'dark',
    isLight: mode === 'light',
  }), [
    currentVariant,
    mode,
    pageOverrides,
    widgetVariants,
    toggleMode,
    changeVariant,
    setThemeOverrides,
    setWidgetVariant,
    getWidgetVariant,
  ]);

  return (
    <CmsThemeContext.Provider value={contextValue}>
      {children}
    </CmsThemeContext.Provider>
  );
};

CmsThemeProvider.displayName = 'CmsThemeProvider';

/**
 * Hook to access CMS theme context
 * Must be used within a CmsThemeProvider
 */
export const useCmsTheme = () => {
  const context = useContext(CmsThemeContext);
  
  if (context === undefined) {
    throw new Error(
      'useCmsTheme must be used within a CmsThemeProvider. ' +
      'Wrap your component tree with <CmsThemeProvider>.'
    );
  }
  
  return context;
};

/**
 * Safe hook for SSR/optional provider usage
 * Returns default values if provider not found
 */
export const useCmsThemeSafe = () => {
  const context = useContext(CmsThemeContext);
  
  if (context === undefined) {
    return {
      currentVariant: 'default',
      mode: 'light',
      pageOverrides: {},
      widgetVariants: {},
      toggleMode: () => {},
      changeVariant: () => {},
      setThemeOverrides: () => {},
      setWidgetVariant: () => {},
      getWidgetVariant: () => 'default',
      isDark: false,
      isLight: true,
    };
  }
  
  return context;
};

export default CmsThemeProvider;
