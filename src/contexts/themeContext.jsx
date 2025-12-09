import React, { 
    createContext, 
    useContext, 
    useState, 
    useEffect, 
    useCallback, 
    useMemo,
    useRef 
  } from 'react';
  import { isRtlLang } from 'rtl-detect';
  
  // Konstansok és típusok
  const STORAGE_KEY = 'theme-preferences';
  const THEME = {
    LIGHT: 'light',
    DARK: 'dark'
  };
  const DIRECTION = {
    LTR: 'ltr',
    RTL: 'rtl'
  };
  const FONT_SCALE = {
    MIN: 0.8,
    MAX: 1.5,
    DEFAULT: 1
  };
  
  // Default értékek
  const DEFAULT_PREFERENCES = {
    theme: THEME.DARK,
    fontScale: FONT_SCALE.DEFAULT,
    direction: DIRECTION.LTR
  };
  
  // Context létrehozása undefined-dal (jobb típusellenőrzés)
  const ThemeContext = createContext(undefined);
  
  // Utility funkciók
  const isBrowser = () => typeof window !== 'undefined';
  const isServer = () => typeof window === 'undefined';
  
  /**
   * Biztonságos localStorage műveletek
   */
  const storage = {
    get: (key) => {
      if (!isBrowser()) return null;
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
      } catch (error) {
        console.warn(`Failed to read from localStorage (${key}):`, error);
        return null;
      }
    },
    
    set: (key, value) => {
      if (!isBrowser()) return false;
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (error) {
        console.warn(`Failed to write to localStorage (${key}):`, error);
        return false;
      }
    },
    
    remove: (key) => {
      if (!isBrowser()) return;
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove from localStorage (${key}):`, error);
      }
    }
  };
  
  /**
   * Böngésző téma preferencia lekérése
   */
  const getBrowserTheme = () => {
    if (!isBrowser()) return THEME.DARK;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
    return mediaQuery.matches ? THEME.LIGHT : THEME.DARK;
  };
  
  /**
   * Nyelv alapú szövegirány detektálása
   */
  const getLanguageDirection = () => {
    if (!isBrowser()) return DIRECTION.LTR;
    try {
      return isRtlLang(navigator.language) ? DIRECTION.RTL : DIRECTION.LTR;
    } catch (error) {
      console.warn('Failed to detect language direction:', error);
      return DIRECTION.LTR;
    }
  };
  
  /**
   * Theme Provider Component
   */
  export const ThemeProvider = ({ children }) => {
    const pageRef = useRef(null);
    const transitionTimeoutRef = useRef(null);
    
    // Page element referencia inicializálása
    useEffect(() => {
      if (isBrowser()) {
        pageRef.current = document.documentElement;
      }
    }, []);
  
    // Mentett preferenciák betöltése (csak egyszer)
    const persistedPreferences = useMemo(() => {
      if (isServer()) return {};
      return storage.get(STORAGE_KEY) || {};
    }, []);
  
    // Kezdeti téma meghatározása
    const initialTheme = useMemo(() => {
      if (isServer()) return THEME.DARK;
      return persistedPreferences.theme || getBrowserTheme();
    }, [persistedPreferences.theme]);
  
    // Kezdeti szövegirány meghatározása
    const initialDirection = useMemo(() => {
      if (isServer()) return DIRECTION.LTR;
      return persistedPreferences.direction || getLanguageDirection();
    }, [persistedPreferences.direction]);
  
    // State-ek
    const [theme, setTheme] = useState(initialTheme);
    const [fontScale, setFontScale] = useState(
      persistedPreferences.fontScale || FONT_SCALE.DEFAULT
    );
    const [direction, setDirection] = useState(initialDirection);
  
    /**
     * CSS transition átmenetileg kikapcsolása (vizuális flicker elkerülése)
     */
    const stopTransition = useCallback(() => {
      if (!pageRef.current) return;
      
      // Tisztítsd az előző timeout-ot
      if (transitionTimeoutRef.current) {
        clearTimeout(transitionTimeoutRef.current);
      }
      
      pageRef.current.classList.add('no-transition');
      
      transitionTimeoutRef.current = setTimeout(() => {
        if (pageRef.current) {
          pageRef.current.classList.remove('no-transition');
        }
      }, 100);
    }, []);
  
    /**
     * Preferenciák mentése localStorage-ba
     */
    const savePreferences = useCallback(() => {
      storage.set(STORAGE_KEY, {
        theme,
        fontScale,
        direction,
        timestamp: Date.now()
      });
    }, [theme, fontScale, direction]);
  
    /**
     * Téma váltása
     */
    const toggleTheme = useCallback(() => {
      setTheme(prev => prev === THEME.LIGHT ? THEME.DARK : THEME.LIGHT);
      stopTransition();
    }, [stopTransition]);
  
    /**
     * Betűméret skálázás beállítása validálással
     */
    const changeFontScale = useCallback((scale) => {
      const validatedScale = Math.max(
        FONT_SCALE.MIN, 
        Math.min(FONT_SCALE.MAX, scale)
      );
      setFontScale(validatedScale);
      stopTransition();
    }, [stopTransition]);
  
    /**
     * Szövegirány váltása
     */
    const toggleDirection = useCallback(() => {
      setDirection(prev => prev === DIRECTION.LTR ? DIRECTION.RTL : DIRECTION.LTR);
    }, []);
  
    /**
     * CSS custom properties és attribútumok alkalmazása
     */
    useEffect(() => {
      const page = pageRef.current;
      if (!page) return;
  
      // CSS változók beállítása
      page.style.setProperty('--font-scale', fontScale.toString());
      page.style.setProperty(
        '--widget-scale', 
        fontScale === 1 ? '0px' : `${fontScale * 3}px`
      );
      
      // Dir attribútum beállítása
      page.setAttribute('dir', direction);
      
      // Preferenciák mentése
      savePreferences();
    }, [fontScale, direction, savePreferences]);
  
    /**
     * Rendszer téma változás figyelése
     */
    useEffect(() => {
      if (isServer() || persistedPreferences.theme) return;
  
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)');
      
      const handleChange = (event) => {
        setTheme(event.matches ? THEME.LIGHT : THEME.DARK);
        stopTransition();
      };
  
      // Modern API használata (addEventListener)
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
      }
      
      // Fallback régebbi böngészőknek
      mediaQuery.addListener(handleChange);
      return () => mediaQuery.removeListener(handleChange);
    }, [stopTransition, persistedPreferences.theme]);
  
    /**
     * Cleanup on unmount
     */
    useEffect(() => {
      return () => {
        const page = pageRef.current;
        if (page) {
          page.style.removeProperty('--font-scale');
          page.style.removeProperty('--widget-scale');
        }
        
        // Timeout cleanup
        if (transitionTimeoutRef.current) {
          clearTimeout(transitionTimeoutRef.current);
        }
      };
    }, []);
  
    // Context érték memoizálása
    const contextValue = useMemo(() => ({
      theme,
      fontScale,
      direction,
      toggleTheme,
      changeFontScale,
      toggleDirection,
      // Extra utility értékek
      isLight: theme === THEME.LIGHT,
      isDark: theme === THEME.DARK,
      isRtl: direction === DIRECTION.RTL,
      isLtr: direction === DIRECTION.LTR
    }), [theme, fontScale, direction, toggleTheme, changeFontScale, toggleDirection]);
  
    return (
      <ThemeContext.Provider value={contextValue}>
        {children}
      </ThemeContext.Provider>
    );
  };
  
  ThemeProvider.displayName = 'ThemeProvider';
  
  /**
   * Custom hook a theme context használatához
   * @throws {Error} Ha Provider-en kívül használjuk
   */
  export const useTheme = () => {
    const context = useContext(ThemeContext);
    
    if (context === undefined) {
      throw new Error(
        'useTheme must be used within a ThemeProvider. ' +
        'Wrap your component tree with <ThemeProvider>.'
      );
    }
    
    return context;
  };
  
  /**
   * Biztonságos hook SSR környezethez (nem dob hibát)
   * @deprecated Használd inkább a useTheme-et és biztosítsd a Provider-t
   */
  export const useThemeProvider = () => {
    const context = useContext(ThemeContext);
    
    if (context === undefined) {
      console.warn(
        'useThemeProvider is used outside of ThemeProvider. ' +
        'Returning default values. Consider using useTheme instead.'
      );
      
      return {
        ...DEFAULT_PREFERENCES,
        toggleTheme: () => {},
        changeFontScale: () => {},
        toggleDirection: () => {},
        isLight: false,
        isDark: true,
        isRtl: false,
        isLtr: true
      };
    }
    
    return context;
  };
  
  // Export konstansok is használatra
  export { THEME, DIRECTION, FONT_SCALE };