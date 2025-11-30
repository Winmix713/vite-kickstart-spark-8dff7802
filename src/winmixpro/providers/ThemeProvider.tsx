import { useCallback, useEffect, type ReactNode } from "react";
import { useLocalStorage } from "@/winmixpro/hooks/useLocalStorage";
import { STORAGE_KEYS } from "@/winmixpro/lib/constants";
import { applyTheme, exportThemeAsCSS, exportThemeAsJSON, getDefaultTheme, getThemeById, PRESET_THEMES } from "@/winmixpro/lib/theme-manager";
import { ThemeContext, ThemeContextValue } from "./ThemeContext";
export { ThemeContext };
interface ThemeProviderProps {
  children: ReactNode;
}
export const ThemeProvider = ({
  children
}: ThemeProviderProps) => {
  const [currentThemeId, setCurrentThemeId] = useLocalStorage<string>(STORAGE_KEYS.THEME, getDefaultTheme().id);
  const [favorites, setFavorites] = useLocalStorage<string[]>(STORAGE_KEYS.THEME_FAVORITES, []);
  const currentTheme = getThemeById(currentThemeId) || getDefaultTheme();
  useEffect(() => {
    applyTheme(currentTheme);
  }, [currentTheme]);
  const setTheme = useCallback((themeId: string) => {
    const theme = getThemeById(themeId);
    if (theme) {
      setCurrentThemeId(themeId);
    }
  }, [setCurrentThemeId]);
  const toggleFavorite = useCallback((themeId: string) => {
    setFavorites(prev => {
      if (prev.includes(themeId)) {
        return prev.filter(id => id !== themeId);
      }
      return [...prev, themeId];
    });
  }, [setFavorites]);
  const exportCSS = useCallback(() => exportThemeAsCSS(currentTheme), [currentTheme]);
  const exportJSON = useCallback(() => exportThemeAsJSON(currentTheme), [currentTheme]);
  const resetTheme = useCallback(() => {
    setCurrentThemeId(getDefaultTheme().id);
    setFavorites([]);
  }, [setCurrentThemeId, setFavorites]);
  const value: ThemeContextValue = {
    currentTheme,
    setTheme,
    presets: PRESET_THEMES,
    favorites,
    toggleFavorite,
    exportCSS,
    exportJSON,
    resetTheme
  };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};