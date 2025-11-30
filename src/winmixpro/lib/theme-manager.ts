import type { CSSVariables, GlassSettings, ThemePalette, ThemePreset } from "@/winmixpro/types";
export const DEFAULT_GLASS_SETTINGS: GlassSettings = {
  blur: "12px",
  opacity: 0.1,
  border: "1px solid rgba(255, 255, 255, 0.15)",
  shadow: "0 8px 32px rgba(0, 0, 0, 0.37)"
};
export const PRESET_THEMES: ThemePreset[] = [{
  id: "aurora",
  name: "Aurora",
  description: "Emerald + indigó átmenet, admin fő téma",
  status: "stable",
  palette: {
    primary: "#10b981",
    secondary: "#3b82f6",
    accent: "#06b6d4",
    background: "#020617",
    foreground: "#ffffff",
    muted: "#64748b",
    border: "rgba(255, 255, 255, 0.15)",
    gradientFrom: "#10b981",
    gradientTo: "#06b6d4"
  },
  glass: {
    blur: "12px",
    opacity: 0.1,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    shadow: "0 8px 32px rgba(0, 0, 0, 0.37)"
  }
}, {
  id: "neon-ember",
  name: "Neon Ember",
  description: "Narancs árnyalat, piaci fókuszú lapokhoz",
  status: "experimental",
  palette: {
    primary: "#f97316",
    secondary: "#ec4899",
    accent: "#fb923c",
    background: "#020617",
    foreground: "#ffffff",
    muted: "#64748b",
    border: "rgba(255, 255, 255, 0.15)",
    gradientFrom: "#f97316",
    gradientTo: "#ec4899"
  },
  glass: {
    blur: "10px",
    opacity: 0.08,
    border: "1px solid rgba(255, 255, 255, 0.12)",
    shadow: "0 8px 32px rgba(249, 115, 22, 0.2)"
  }
}, {
  id: "fjord",
  name: "Fjord",
  description: "Kék-lila gradient, monitoring nézet",
  status: "stable",
  palette: {
    primary: "#0ea5e9",
    secondary: "#6366f1",
    accent: "#8b5cf6",
    background: "#020617",
    foreground: "#ffffff",
    muted: "#64748b",
    border: "rgba(255, 255, 255, 0.15)",
    gradientFrom: "#0ea5e9",
    gradientTo: "#6366f1"
  },
  glass: {
    blur: "14px",
    opacity: 0.12,
    border: "1px solid rgba(255, 255, 255, 0.18)",
    shadow: "0 8px 32px rgba(99, 102, 241, 0.25)"
  }
}, {
  id: "slate-glow",
  name: "Slate Glow",
  description: "Semleges, audit és riport lapok",
  status: "experimental",
  palette: {
    primary: "#e2e8f0",
    secondary: "#cbd5e1",
    accent: "#94a3b8",
    background: "#020617",
    foreground: "#ffffff",
    muted: "#64748b",
    border: "rgba(255, 255, 255, 0.15)",
    gradientFrom: "#e2e8f0",
    gradientTo: "#f8fafc"
  },
  glass: {
    blur: "8px",
    opacity: 0.06,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    shadow: "0 8px 32px rgba(0, 0, 0, 0.3)"
  }
}, {
  id: "midnight-purple",
  name: "Midnight Purple",
  description: "Mély lila, AI modellezési felületekhez",
  status: "stable",
  palette: {
    primary: "#a855f7",
    secondary: "#c026d3",
    accent: "#d946ef",
    background: "#020617",
    foreground: "#ffffff",
    muted: "#64748b",
    border: "rgba(255, 255, 255, 0.15)",
    gradientFrom: "#a855f7",
    gradientTo: "#d946ef"
  },
  glass: {
    blur: "12px",
    opacity: 0.1,
    border: "1px solid rgba(168, 85, 247, 0.2)",
    shadow: "0 8px 32px rgba(168, 85, 247, 0.3)"
  }
}, {
  id: "forest-mint",
  name: "Forest Mint",
  description: "Természetes zöld, adatminőség lapokhoz",
  status: "experimental",
  palette: {
    primary: "#22c55e",
    secondary: "#84cc16",
    accent: "#4ade80",
    background: "#020617",
    foreground: "#ffffff",
    muted: "#64748b",
    border: "rgba(255, 255, 255, 0.15)",
    gradientFrom: "#22c55e",
    gradientTo: "#84cc16"
  },
  glass: {
    blur: "12px",
    opacity: 0.1,
    border: "1px solid rgba(34, 197, 94, 0.2)",
    shadow: "0 8px 32px rgba(34, 197, 94, 0.25)"
  }
}];
export const paletteToCSSVariables = (palette: ThemePalette): CSSVariables => ({
  "--color-primary": palette.primary,
  "--color-secondary": palette.secondary,
  "--color-accent": palette.accent,
  "--color-background": palette.background,
  "--color-foreground": palette.foreground,
  "--color-muted": palette.muted,
  "--color-border": palette.border,
  "--gradient-from": palette.gradientFrom,
  "--gradient-to": palette.gradientTo
});
export const glassSettingsToCSSVariables = (glass: GlassSettings): CSSVariables => ({
  "--glass-blur": glass.blur,
  "--glass-opacity": glass.opacity.toString(),
  "--glass-border": glass.border,
  "--glass-shadow": glass.shadow
});
export const applyTheme = (theme: ThemePreset): void => {
  if (typeof window === "undefined") return;
  const root = document.documentElement;
  const paletteVars = paletteToCSSVariables(theme.palette);
  const glassVars = glassSettingsToCSSVariables(theme.glass);
  Object.entries({
    ...paletteVars,
    ...glassVars
  }).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};
export const exportThemeAsCSS = (theme: ThemePreset): string => {
  const paletteVars = paletteToCSSVariables(theme.palette);
  const glassVars = glassSettingsToCSSVariables(theme.glass);
  const cssLines = Object.entries({
    ...paletteVars,
    ...glassVars
  }).map(([key, value]) => `  ${key}: ${value};`);
  return `:root {\n${cssLines.join("\n")}\n}`;
};
export const exportThemeAsJSON = (theme: ThemePreset): string => JSON.stringify(theme, null, 2);
export const getThemeById = (id: string): ThemePreset | undefined => PRESET_THEMES.find(theme => theme.id === id);
export const getDefaultTheme = (): ThemePreset => PRESET_THEMES[0];