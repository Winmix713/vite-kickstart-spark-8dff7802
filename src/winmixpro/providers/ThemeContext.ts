import { createContext } from "react";
import type { ThemePreset } from "@/winmixpro/types";
export interface ThemeContextValue {
  currentTheme: ThemePreset;
  setTheme: (themeId: string) => void;
  presets: ThemePreset[];
  favorites: string[];
  toggleFavorite: (themeId: string) => void;
  exportCSS: () => string;
  exportJSON: () => string;
  resetTheme: () => void;
}
export const ThemeContext = createContext<ThemeContextValue | null>(null);