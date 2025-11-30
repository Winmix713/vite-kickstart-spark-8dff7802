// Environment Variables Types
export interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
  is_secret: boolean;
  category: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
export interface EnvironmentVariableSafe {
  id: string;
  key: string;
  value: string; // Masked if secret
  description?: string;
  is_secret: boolean;
  category: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
export interface EnvironmentVariableFormData {
  key: string;
  value: string;
  description?: string;
  is_secret: boolean;
  category: string;
}
export interface EnvImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

// Audit Log Types
export interface AuditLog {
  id: string;
  user_id?: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}
export interface AuditLogFilters {
  action?: string;
  table_name?: string;
  user_id?: string;
  date_from?: string;
  date_to?: string;
}

// Enhanced Admin Types
export interface AdminAction {
  id: string;
  name: string;
  description: string;
  icon?: string;
  requiresRole?: 'admin' | 'analyst' | 'user';
  path?: string;
  action?: () => void;
}
export interface AdminStats {
  totalModels: number;
  activeModels: number;
  totalJobs: number;
  activeJobs: number;
  totalEnvVars: number;
  secretEnvVars: number;
  recentAudits: number;
  systemHealth: 'healthy' | 'warning' | 'error';
}

// Enhanced Model Types
export interface ModelAction {
  type: 'activate' | 'deactivate' | 'promote' | 'retire' | 'duplicate';
  label: string;
  icon: string;
  requiresRole?: 'admin' | 'analyst';
}

// Enhanced Job Types
export interface JobFormData {
  job_name: string;
  job_type: string;
  cron_schedule: string;
  enabled: boolean;
  config: Record<string, unknown>;
}
export interface CronValidation {
  valid: boolean;
  description?: string;
  next_runs?: string[];
}

// Enhanced Match Types
export interface MatchFormData {
  league_id: string;
  home_team_id: string;
  away_team_id: string;
  match_date: string;
  venue?: string;
  status?: 'scheduled' | 'live' | 'completed' | 'cancelled';
  home_score?: number | null;
  away_score?: number | null;
  halftime_home_score?: number | null;
  halftime_away_score?: number | null;
}
export interface CSVImportResult {
  total: number;
  imported: number;
  skipped: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

// System Health Types
export interface SystemWarning {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  description: string;
  link?: string;
  linkText?: string;
  timestamp: string;
}
export interface AdminQuickLink {
  id: string;
  title: string;
  description: string;
  url: string;
  icon: string;
  category: 'system' | 'data' | 'security' | 'monitoring';
}

// API Response Types
export interface AdminApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Form Validation Types
export interface ValidationError {
  field: string;
  message: string;
}
export interface FormState<T> {
  data: T;
  errors: ValidationError[];
  isSubmitting: boolean;
  isDirty: boolean;
}

// Utility Types
export type AdminRole = 'admin' | 'analyst' | 'user';
export type EnvironmentCategory = 'general' | 'database' | 'api' | 'email' | 'security' | 'cache' | 'ai' | 'logging' | 'limits';
export type JobType = 'data_import' | 'prediction' | 'aggregation' | 'maintenance' | 'monitoring';

// Navigation & Breadcrumb Types
export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}
export interface AdminNavItem {
  label: string;
  description?: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  roles?: AdminRole[];
}

// Admin User Management Types
export interface AdminUser {
  id: string;
  email: string;
  role: AdminRole;
  created_at?: string | null;
  full_name?: string | null;
}
export interface AdminUsersResponse {
  users: AdminUser[];
  total: number;
}
export type AdminAuditAction = "user_created" | "user_deleted" | "role_changed" | "job_started" | "job_stopped" | "phase9_updated" | "feedback_viewed" | "feedback_exported" | "feedback_resolved" | "feedback_reopened";

// Admin Dashboard Card Type
export interface AdminCategoryCard {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ComponentType<{
    className?: string;
  }>;
  accentColorClass: string;
  value: string | number | null;
  pill?: string;
  allowedRoles?: AdminRole[];
}

// Phase 9 Settings Types
export interface AdminPhase9Settings {
  id: number;
  collaborative_intelligence_enabled: boolean;
  temporal_decay_enabled: boolean;
  temporal_decay_rate: number;
  freshness_check_seconds: number;
  staleness_threshold_days: number;
  market_integration_mode: 'off' | 'test' | 'prod';
  market_api_key: string | null;
  cross_league_enabled: boolean;
  cross_league_league_count: number;
  cross_league_depth: 'low' | 'medium' | 'high';
  updated_at: string;
}
export interface AdminPhase9SettingsInput {
  collaborative_intelligence_enabled: boolean;
  temporal_decay_enabled: boolean;
  temporal_decay_rate: number;
  freshness_check_seconds: number;
  staleness_threshold_days: number;
  market_integration_mode: 'off' | 'test' | 'prod';
  market_api_key: string | null;
  cross_league_enabled: boolean;
  cross_league_league_count: number;
  cross_league_depth: 'low' | 'medium' | 'high';
}

// Jobs Manager & Hook Options
import type { JobSummary } from "@/types/jobs";
export interface AdminJobsManagerResult {
  status?: 'started' | 'stopped' | 'error' | string;
  job?: JobSummary;
  jobId?: string;
  error?: string;
  message?: string;
}
export interface UseJobsOptions {
  refetchInterval?: number;
  enabled?: boolean;
}