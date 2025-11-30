export interface JobLog {
  id: string;
  started_at: string;
  completed_at: string | null;
  status: "running" | "success" | "error";
  duration_ms: number | null;
  records_processed: number | null;
  error_message: string | null;
  error_stack?: string | null;
}
export interface JobStats {
  total_runs: number;
  success_runs: number;
}
export interface JobSummary {
  id: string;
  job_name: string;
  job_type: string;
  cron_schedule: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  config: Record<string, unknown>;
  is_due: boolean;
  average_duration_ms: number | null;
  stats: JobStats;
  last_log: JobLog | null;
  recent_logs?: JobLog[];
}
export interface JobExecutionResult {
  success: boolean;
  recordsProcessed: number;
  durationMs: number;
  startedAt: string;
  completedAt: string;
  logId: string;
  error?: string;
}
export interface JobListResponse {
  jobs: JobSummary[];
}
export interface JobLogsResponse {
  logs: JobLog[];
}
export interface JobToggleResponse {
  job: JobSummary;
}
export interface JobTriggerResponse {
  result: JobExecutionResult;
}