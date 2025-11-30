import type { LocalStorageKey } from "@/winmixpro/types";
export const STORAGE_KEYS: Record<string, LocalStorageKey> = {
  THEME: "winmixpro-theme",
  THEME_FAVORITES: "winmixpro-theme-favorites",
  FEATURE_FLAGS: "winmixpro-feature-flags",
  USERS_FILTER: "winmixpro-users-filter",
  USERS_ACTIVE: "winmixpro-users-active",
  JOB_FILTER: "winmixpro-job-filter",
  JOB_STATE: "winmixpro-job-state",
  INTEGRATIONS_VERIFIED: "winmixpro-integrations-verified",
  FEEDBACK_STATUS: "winmixpro-feedback-status",
  PHASE9_SETTINGS: "winmixpro-phase9-settings",
  UI_PINS: "winmixpro-ui-pins",
  STATS_LEAGUE: "winmixpro-stats-league",
  STATS_RANGE: "winmixpro-stats-range",
  PREDICTION_RANGE: "winmixpro-prediction-range"
};
export const GLASS_PRESETS = {
  LIGHT: {
    blur: "8px",
    opacity: 0.05,
    border: "1px solid rgba(255, 255, 255, 0.1)",
    shadow: "0 4px 16px rgba(0, 0, 0, 0.25)"
  },
  MEDIUM: {
    blur: "12px",
    opacity: 0.1,
    border: "1px solid rgba(255, 255, 255, 0.15)",
    shadow: "0 8px 32px rgba(0, 0, 0, 0.37)"
  },
  HEAVY: {
    blur: "16px",
    opacity: 0.15,
    border: "1px solid rgba(255, 255, 255, 0.2)",
    shadow: "0 12px 48px rgba(0, 0, 0, 0.45)"
  }
} as const;
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
  SHIMMER: 2000
} as const;
export const TRANSITION_CLASSES = {
  DEFAULT: "transition-all duration-300 ease-in-out",
  FAST: "transition-all duration-150 ease-in-out",
  SLOW: "transition-all duration-500 ease-in-out",
  COLORS: "transition-colors duration-300 ease-in-out",
  TRANSFORM: "transition-transform duration-300 ease-in-out"
} as const;
export const REFRESH_INTERVALS = {
  DASHBOARD: 30000,
  HEALTH: 10000,
  JOBS: 15000,
  PREDICTIONS: 60000
} as const;
export const PAGINATION = {
  DEFAULT_PAGE_SIZE: 20,
  PAGE_SIZE_OPTIONS: [10, 20, 50, 100]
} as const;
export const CHART_COLORS = {
  PRIMARY: "#10b981",
  SECONDARY: "#3b82f6",
  ACCENT: "#06b6d4",
  WARNING: "#f59e0b",
  DANGER: "#ef4444",
  SUCCESS: "#22c55e",
  MUTED: "#64748b"
} as const;