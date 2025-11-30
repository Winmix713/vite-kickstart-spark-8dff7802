import { useState, useEffect, useCallback } from "react";
interface ThemePreset {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    foreground: string;
  };
  typography: {
    fontFamily: string;
    fontSize: {
      xs: number;
      sm: number;
      base: number;
      lg: number;
      xl: number;
    };
  };
}
const STORAGE_KEY = "winmixpro-theme";
const DEFAULT_THEME: ThemePreset = {
  id: "emerald-dark",
  name: "Smaragd sötét",
  description: "Prémium sötét téma smaragd akcentussal",
  colors: {
    primary: "#10b981",
    secondary: "#f97316",
    accent: "#10b981",
    background: "#0f172a",
    foreground: "#f1f5f9"
  },
  typography: {
    fontFamily: "Inter",
    fontSize: {
      xs: 12,
      sm: 14,
      base: 16,
      lg: 18,
      xl: 20
    }
  }
};
export const useThemeManager = () => {
  const [theme, setTheme] = useState<ThemePreset>(DEFAULT_THEME);
  const [isLoading, setIsLoading] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const loadTheme = () => {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          setTheme(JSON.parse(saved));
        }
      } catch (error) {
        console.error("Failed to load theme from localStorage:", error);
      }
    };
    loadTheme();
  }, []);
  const updateTheme = useCallback((updates: Partial<ThemePreset>) => {
    setTheme(prev => ({
      ...prev,
      ...updates
    }));
  }, []);
  const updateColors = useCallback((colorUpdates: Partial<ThemePreset["colors"]>) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        ...colorUpdates
      }
    }));
  }, []);
  const updateTypography = useCallback((typographyUpdates: Partial<ThemePreset["typography"]>) => {
    setTheme(prev => ({
      ...prev,
      typography: {
        ...prev.typography,
        ...typographyUpdates
      }
    }));
  }, []);
  const saveTheme = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to save theme"
      };
    }
  }, [theme]);
  const resetToDefault = useCallback(() => {
    setTheme(DEFAULT_THEME);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_THEME));
    } catch (error) {
      console.error("Failed to reset theme:", error);
    }
  }, []);
  const exportAsJSON = useCallback(() => {
    return JSON.stringify(theme, null, 2);
  }, [theme]);
  const importFromJSON = useCallback((jsonString: string) => {
    try {
      const imported = JSON.parse(jsonString) as ThemePreset;

      // Validate basic structure
      if (!imported.id || !imported.colors || !imported.typography || !imported.colors.primary || !imported.colors.background) {
        throw new Error("Invalid theme structure");
      }
      setTheme(imported);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(imported));
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Failed to import theme"
      };
    }
  }, []);
  return {
    theme,
    isLoading,
    updateTheme,
    updateColors,
    updateTypography,
    saveTheme,
    resetToDefault,
    exportAsJSON,
    importFromJSON
  };
};