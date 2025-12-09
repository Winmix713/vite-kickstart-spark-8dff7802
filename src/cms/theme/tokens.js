// Core color palette
export const colorPalette = {
  white: "#ffffff",
  black: "#000000",
  gray: {
    50: "#f9fafb",
    100: "#f3f4f6",
    200: "#e5e7eb",
    300: "#d1d5db",
    400: "#9ca3af",
    500: "#6b7280",
    600: "#4b5563",
    700: "#374151",
    800: "#1f2937",
    900: "#111827",
  },
  blue: {
    50: "#eff6ff",
    100: "#dbeafe",
    200: "#bfdbfe",
    300: "#93c5fd",
    400: "#60a5fa",
    500: "#3b82f6",
    600: "#2563eb",
    700: "#1d4ed8",
    800: "#1e40af",
    900: "#1e3a8a",
  },
  green: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#22c55e",
    600: "#16a34a",
    700: "#15803d",
    800: "#166534",
    900: "#145231",
  },
  emerald: {
    50: "#f0fdf4",
    100: "#dcfce7",
    200: "#bbf7d0",
    300: "#86efac",
    400: "#4ade80",
    500: "#10b981",
    600: "#059669",
    700: "#047857",
    800: "#065f46",
    900: "#064e3b",
  },
  red: {
    50: "#fef2f2",
    100: "#fee2e2",
    200: "#fecaca",
    300: "#fca5a5",
    400: "#f87171",
    500: "#ef4444",
    600: "#dc2626",
    700: "#b91c1c",
    800: "#991b1b",
    900: "#7f1d1d",
  },
  amber: {
    50: "#fffbeb",
    100: "#fef3c7",
    200: "#fde68a",
    300: "#fcd34d",
    400: "#fbbf24",
    500: "#f59e0b",
    600: "#d97706",
    700: "#b45309",
    800: "#92400e",
    900: "#78350f",
  },
  purple: {
    50: "#faf5ff",
    100: "#f3e8ff",
    200: "#e9d5ff",
    300: "#d8b4fe",
    400: "#c084fc",
    500: "#a855f7",
    600: "#9333ea",
    700: "#7e22ce",
    800: "#6b21a8",
    900: "#581c87",
  },
};

export const typography = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    serif: 'Georgia, "Times New Roman", Times, serif',
    mono: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
  },
  fontSize: {
    xs: "0.75rem",
    sm: "0.875rem",
    base: "1rem",
    lg: "1.125rem",
    xl: "1.25rem",
    "2xl": "1.5rem",
    "3xl": "1.875rem",
    "4xl": "2.25rem",
  },
  fontWeight: {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

export const spacing = {
  0: "0",
  1: "0.25rem",
  2: "0.5rem",
  3: "0.75rem",
  4: "1rem",
  5: "1.25rem",
  6: "1.5rem",
  8: "2rem",
  10: "2.5rem",
  12: "3rem",
  16: "4rem",
  20: "5rem",
  24: "6rem",
};

export const radii = {
  none: "0",
  sm: "0.125rem",
  base: "0.25rem",
  md: "0.375rem",
  lg: "0.5rem",
  xl: "0.75rem",
  "2xl": "1rem",
  "3xl": "1.5rem",
  full: "9999px",
};

export const shadows = {
  none: "none",
  sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
  base: "0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)",
  md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
  xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
};

export const transitions = {
  fast: "150ms cubic-bezier(0.4, 0, 0.2, 1)",
  base: "200ms cubic-bezier(0.4, 0, 0.2, 1)",
  slow: "300ms cubic-bezier(0.4, 0, 0.2, 1)",
};

export const themeVariants = {
  default: {
    name: "Default",
    description: "Clean, modern default theme",
    colors: {
      light: {
        background: colorPalette.white,
        foreground: colorPalette.gray[900],
        surface: colorPalette.gray[50],
        border: colorPalette.gray[200],
        muted: colorPalette.gray[400],
        primary: colorPalette.blue[600],
        primary_foreground: colorPalette.white,
        secondary: colorPalette.gray[600],
        secondary_foreground: colorPalette.white,
        accent: colorPalette.blue[500],
        success: colorPalette.green[600],
        warning: colorPalette.amber[500],
        error: colorPalette.red[600],
        info: colorPalette.blue[500],
      },
      dark: {
        background: colorPalette.gray[900],
        foreground: colorPalette.gray[50],
        surface: colorPalette.gray[800],
        border: colorPalette.gray[700],
        muted: colorPalette.gray[500],
        primary: colorPalette.blue[400],
        primary_foreground: colorPalette.gray[900],
        secondary: colorPalette.gray[400],
        secondary_foreground: colorPalette.gray[900],
        accent: colorPalette.blue[400],
        success: colorPalette.green[400],
        warning: colorPalette.amber[400],
        error: colorPalette.red[400],
        info: colorPalette.blue[400],
      },
    },
    typography: {
      fontSize: typography.fontSize,
      fontFamily: typography.fontFamily,
      fontWeight: typography.fontWeight,
    },
    spacing: spacing,
    radii: radii,
    shadows: shadows,
  },

  glass: {
    name: "Glass",
    description: "Glassmorphism theme with frosted glass effects",
    colors: {
      light: {
        background: "rgba(255, 255, 255, 0.95)",
        foreground: colorPalette.gray[900],
        surface: "rgba(255, 255, 255, 0.7)",
        border: "rgba(0, 0, 0, 0.1)",
        muted: colorPalette.gray[500],
        primary: colorPalette.blue[600],
        primary_foreground: colorPalette.white,
        secondary: colorPalette.gray[600],
        secondary_foreground: colorPalette.white,
        accent: colorPalette.blue[500],
        success: colorPalette.green[600],
        warning: colorPalette.amber[500],
        error: colorPalette.red[600],
        info: colorPalette.blue[500],
      },
      dark: {
        background: "rgba(17, 24, 39, 0.95)",
        foreground: colorPalette.gray[50],
        surface: "rgba(31, 41, 55, 0.7)",
        border: "rgba(255, 255, 255, 0.1)",
        muted: colorPalette.gray[400],
        primary: colorPalette.blue[400],
        primary_foreground: colorPalette.gray[900],
        secondary: colorPalette.gray[400],
        secondary_foreground: colorPalette.gray[900],
        accent: colorPalette.blue[400],
        success: colorPalette.green[400],
        warning: colorPalette.amber[400],
        error: colorPalette.red[400],
        info: colorPalette.blue[400],
      },
    },
    typography: typography,
    spacing: spacing,
    radii: { ...radii, lg: "1.5rem", xl: "2rem" },
    shadows: {
      none: "none",
      sm: "0 8px 32px rgba(31, 38, 135, 0.1)",
      base: "0 8px 32px rgba(31, 38, 135, 0.15)",
      md: "0 8px 32px rgba(31, 38, 135, 0.2)",
      lg: "0 8px 32px rgba(31, 38, 135, 0.25)",
      xl: "0 8px 32px rgba(31, 38, 135, 0.3)",
    },
  },

  emerald: {
    name: "Emerald",
    description: "Green-themed variant with emerald accents",
    colors: {
      light: {
        background: colorPalette.white,
        foreground: colorPalette.gray[900],
        surface: colorPalette.emerald[50],
        border: colorPalette.emerald[200],
        muted: colorPalette.gray[400],
        primary: colorPalette.emerald[600],
        primary_foreground: colorPalette.white,
        secondary: colorPalette.emerald[500],
        secondary_foreground: colorPalette.white,
        accent: colorPalette.emerald[500],
        success: colorPalette.emerald[600],
        warning: colorPalette.amber[500],
        error: colorPalette.red[600],
        info: colorPalette.emerald[500],
      },
      dark: {
        background: colorPalette.gray[900],
        foreground: colorPalette.gray[50],
        surface: colorPalette.emerald[900],
        border: colorPalette.emerald[800],
        muted: colorPalette.gray[500],
        primary: colorPalette.emerald[400],
        primary_foreground: colorPalette.gray[900],
        secondary: colorPalette.emerald[400],
        secondary_foreground: colorPalette.gray[900],
        accent: colorPalette.emerald[400],
        success: colorPalette.emerald[400],
        warning: colorPalette.amber[400],
        error: colorPalette.red[400],
        info: colorPalette.emerald[400],
      },
    },
    typography: typography,
    spacing: spacing,
    radii: radii,
    shadows: shadows,
  },

  dark: {
    name: "Dark",
    description: "High contrast dark theme",
    colors: {
      light: {
        background: "#0a0a0a",
        foreground: colorPalette.white,
        surface: colorPalette.gray[900],
        border: colorPalette.gray[800],
        muted: colorPalette.gray[600],
        primary: colorPalette.blue[400],
        primary_foreground: "#0a0a0a",
        secondary: colorPalette.gray[400],
        secondary_foreground: "#0a0a0a",
        accent: colorPalette.blue[300],
        success: colorPalette.green[400],
        warning: colorPalette.amber[400],
        error: colorPalette.red[400],
        info: colorPalette.blue[300],
      },
      dark: {
        background: "#0a0a0a",
        foreground: colorPalette.white,
        surface: colorPalette.gray[900],
        border: colorPalette.gray[800],
        muted: colorPalette.gray[600],
        primary: colorPalette.blue[300],
        primary_foreground: "#0a0a0a",
        secondary: colorPalette.gray[300],
        secondary_foreground: "#0a0a0a",
        accent: colorPalette.blue[300],
        success: colorPalette.green[300],
        warning: colorPalette.amber[300],
        error: colorPalette.red[300],
        info: colorPalette.blue[300],
      },
    },
    typography: typography,
    spacing: spacing,
    radii: radii,
    shadows: shadows,
  },
};

export const widgetStyleVariants = {
  default: {
    slug: "default",
    label: "Default",
    description: "Standard widget styling",
    supportedTokens: ["colors", "spacing", "radii", "shadows"],
  },
  compact: {
    slug: "compact",
    label: "Compact",
    description: "Reduced padding and spacing",
    supportedTokens: ["colors", "spacing", "radii"],
  },
  minimal: {
    slug: "minimal",
    label: "Minimal",
    description: "No borders or shadows",
    supportedTokens: ["colors", "spacing"],
  },
  outlined: {
    slug: "outlined",
    label: "Outlined",
    description: "Strong border emphasis",
    supportedTokens: ["colors", "spacing", "radii"],
    cssClass: "widget-outlined",
  },
  elevated: {
    slug: "elevated",
    label: "Elevated",
    description: "Prominent shadows and depth",
    supportedTokens: ["colors", "spacing", "radii", "shadows"],
  },
};

export const buildCssVariables = (themeTokens, mode = "light") => {
  const cssVars = {};

  const colors = themeTokens.colors?.[mode] || {};
  const typography = themeTokens.typography || {};
  const spacing = themeTokens.spacing || {};
  const radii = themeTokens.radii || {};
  const shadows = themeTokens.shadows || {};

  Object.entries(colors).forEach(([key, value]) => {
    cssVars[`--cms-color-${key}`] = value;
  });

  if (typography.fontSize) {
    Object.entries(typography.fontSize).forEach(([key, value]) => {
      cssVars[`--cms-font-size-${key}`] = value;
    });
  }

  if (typography.fontFamily) {
    Object.entries(typography.fontFamily).forEach(([key, value]) => {
      cssVars[`--cms-font-family-${key}`] = value;
    });
  }

  if (typography.fontWeight) {
    Object.entries(typography.fontWeight).forEach(([key, value]) => {
      cssVars[`--cms-font-weight-${key}`] = value;
    });
  }

  Object.entries(spacing).forEach(([key, value]) => {
    cssVars[`--cms-spacing-${key}`] = value;
  });

  Object.entries(radii).forEach(([key, value]) => {
    cssVars[`--cms-radius-${key}`] = value;
  });

  Object.entries(shadows).forEach(([key, value]) => {
    cssVars[`--cms-shadow-${key}`] = value;
  });

  return cssVars;
};

export const getThemeVariant = (name) => {
  return themeVariants[name] || null;
};

export const getThemeVariantNames = () => {
  return Object.keys(themeVariants);
};

export const getWidgetStyleVariant = (slug) => {
  return widgetStyleVariants[slug] || null;
};

export const getWidgetStyleVariantSlugs = () => {
  return Object.keys(widgetStyleVariants);
};

export default {
  colorPalette,
  typography,
  spacing,
  radii,
  shadows,
  transitions,
  themeVariants,
  widgetStyleVariants,
  buildCssVariables,
  getThemeVariant,
  getThemeVariantNames,
  getWidgetStyleVariant,
  getWidgetStyleVariantSlugs,
};
