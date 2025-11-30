import type { ComponentType } from "react";
export interface WinmixProNavItem {
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{
    className?: string;
  }>;
  badge?: string;
}
export interface WinmixProNavSection {
  title: string;
  items: WinmixProNavItem[];
}
export interface AdminKPI {
  label: string;
  value: string | number;
  trend?: string;
  intent?: "positive" | "neutral" | "warning" | "critical";
  description?: string;
}
export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  palette: ThemePalette;
  glass: GlassSettings;
  status: "stable" | "experimental";
}
export interface ThemePalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
  border: string;
  gradientFrom: string;
  gradientTo: string;
}
export interface GlassSettings {
  blur: string;
  opacity: number;
  border: string;
  shadow: string;
}
export interface CSSVariables {
  [key: string]: string;
}
export interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rolloutPercentage?: number;
  metadata?: Record<string, unknown>;
  dependencies?: string[];
  category: "feature" | "experiment" | "killswitch" | "operational";
}
export interface FeatureFlagsConfig {
  flags: FeatureFlag[];
  version: string;
  lastUpdated: string;
}
export interface ActivityLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  details?: string;
  severity?: "info" | "warning" | "error";
}
export interface ComponentCategory {
  id: string;
  name: string;
  description: string;
  count: number;
  coverage: number;
  dependencies: string[];
  owner: string;
  status: "stable" | "watch" | "deprecated";
}
export interface DashboardMetrics {
  totalUsers: number;
  activeJobs: number;
  accuracy: number;
  modelsDeployed: number;
  uptime: number;
  avgResponseTime: number;
}
export type LocalStorageKey = "winmixpro-theme" | "winmixpro-theme-favorites" | "winmixpro-feature-flags" | "winmixpro-users-filter" | "winmixpro-users-active" | "winmixpro-job-filter" | "winmixpro-job-state" | "winmixpro-integrations-verified" | "winmixpro-feedback-status" | "winmixpro-phase9-settings" | "winmixpro-ui-pins" | "winmixpro-stats-league" | "winmixpro-stats-range" | "winmixpro-prediction-range";