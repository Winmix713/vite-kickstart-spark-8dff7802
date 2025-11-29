import parser from "npm:cron-parser@4.9.0";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

type GenericSupabaseClient = SupabaseClient<Record<string, unknown>>;

export interface JobConfig {
  prediction_window_hours?: number | string;
  retention_days?: number | string;
  description?: string;
  [key: string]: unknown;
}

export interface ScheduledJobRecord {
  id: string;
  job_name: string;
  job_type: string;
  cron_schedule: string;
  enabled: boolean;
  last_run_at: string | null;
  next_run_at: string | null;
  config: JobConfig | null;
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

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables");
}

function ensureConfig(config: JobConfig | null | unknown): JobConfig {
  if (!config || typeof config !== "object" || Array.isArray(config)) {
    return {};
  }
  return config as JobConfig;
}

export function calculateNextRun(cronSchedule: string, fromDate: Date = new Date()): Date | null {
  try {
    const interval = parser.parseExpression(cronSchedule, { currentDate: fromDate });
    return interval.next().toDate();
  } catch (error) {
    console.error("Failed to parse cron schedule", cronSchedule, error);
    return null;
  }
}

function toPositiveNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return fallback;
}

async function runPredictionJob(supabase: GenericSupabaseClient, job: ScheduledJobRecord): Promise<number> {
  const config = ensureConfig(job.config);
  const predictionWindowHours = toPositiveNumber(config.prediction_window_hours, 24);

  const now = new Date();
  const windowEnd = new Date(now.getTime() + predictionWindowHours * 60 * 60 * 1000);

  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select("id, match_date")
    .eq("status", "scheduled")
    .gte("match_date", now.toISOString())
    .lte("match_date", windowEnd.toISOString());

  if (matchesError) {
    throw matchesError;
  }

  if (!matches || matches.length === 0) {
    return 0;
  }

  let processed = 0;

  for (const match of matches) {
    if (!match?.id) continue;

    const { data: existingPrediction, error: predictionCheckError } = await supabase
      .from("predictions")
      .select("id")
      .eq("match_id", match.id)
      .maybeSingle();

    if (predictionCheckError) {
      console.error("Failed to check existing prediction for match", match.id, predictionCheckError);
      continue;
    }

    if (existingPrediction) {
      continue;
    }

    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/analyze-match`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
        },
        body: JSON.stringify({ matchId: match.id }),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        console.error("analyze-match responded with non-OK status", response.status, errorBody);
        continue;
      }

      processed += 1;
    } catch (error) {
      console.error("Failed to call analyze-match for match", match.id, error);
    }
  }

  return processed;
}

async function runMaintenanceJob(supabase: GenericSupabaseClient, job: ScheduledJobRecord): Promise<number> {
  const config = ensureConfig(job.config);
  const retentionDays = toPositiveNumber(config.retention_days, 30);
  const cutoff = new Date(Date.now() - retentionDays * 24 * 60 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("job_execution_logs")
    .delete()
    .lt("started_at", cutoff)
    .select("id");

  if (error) {
    throw error;
  }

  return data?.length ?? 0;
}

async function runAggregationJob(supabase: GenericSupabaseClient): Promise<number> {
  const { data: templates, error: templateError } = await supabase
    .from("pattern_templates")
    .select("id");

  if (templateError) {
    throw templateError;
  }

  if (!templates || templates.length === 0) {
    return 0;
  }

  let processed = 0;

  for (const template of templates) {
    if (!template?.id) continue;

    const { data: detections, error: detectionsError } = await supabase
      .from("detected_patterns")
      .select("match_id")
      .eq("template_id", template.id);

    if (detectionsError) {
      console.error("Failed to fetch detections for template", template.id, detectionsError);
      continue;
    }

    const matchIds = detections?.map((d) => d.match_id).filter(Boolean) ?? [];

    let totalPredictions = matchIds.length;
    let correctPredictions = 0;

    if (matchIds.length > 0) {
      const { data: predictions, error: predictionsError } = await supabase
        .from("predictions")
        .select("was_correct")
        .in("match_id", matchIds)
        .not("was_correct", "is", null);

      if (predictionsError) {
        console.error("Failed to fetch predictions for template", template.id, predictionsError);
      } else if (predictions) {
        totalPredictions = predictions.length;
        correctPredictions = predictions.filter((p) => p.was_correct === true).length;
      }
    } else {
      totalPredictions = 0;
    }

    const accuracyRate = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    const { error: updateError } = await supabase
      .from("pattern_accuracy")
      .update({
        total_predictions: totalPredictions,
        correct_predictions: correctPredictions,
        accuracy_rate: Math.round(accuracyRate * 100) / 100,
        last_updated: new Date().toISOString(),
      })
      .eq("template_id", template.id);

    if (updateError) {
      console.error("Failed to update pattern accuracy for template", template.id, updateError);
      continue;
    }

    processed += 1;
  }

  return processed;
}

async function runDataImportJob(): Promise<number> {
  // Placeholder for future external integrations. For now, simply acknowledge execution.
  console.info("fetch_upcoming_fixtures job executed - no external data source configured yet");
  return 0;
}

async function runJobLogic(supabase: GenericSupabaseClient, job: ScheduledJobRecord): Promise<number> {
  switch (job.job_type) {
    case "prediction":
      return runPredictionJob(supabase, job);
    case "maintenance":
      return runMaintenanceJob(supabase, job);
    case "aggregation":
      return runAggregationJob(supabase);
    case "data_import":
    default:
      return runDataImportJob();
  }
}

export async function executeJob(
  supabase: GenericSupabaseClient,
  job: ScheduledJobRecord,
  options: { force?: boolean } = {},
): Promise<JobExecutionResult> {
  const force = options.force ?? false;

  if (!job.enabled && !force) {
    return {
      success: false,
      recordsProcessed: 0,
      durationMs: 0,
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      logId: "",
      error: "Job is disabled",
    };
  }

  const { data: runningLog } = await supabase
    .from("job_execution_logs")
    .select("id, started_at")
    .eq("job_id", job.id)
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (runningLog && !force) {
    return {
      success: false,
      recordsProcessed: 0,
      durationMs: 0,
      startedAt: runningLog.started_at,
      completedAt: runningLog.started_at,
      logId: runningLog.id,
      error: "Job is already running",
    };
  }

  const startedAt = new Date();
  const { data: logRow, error: logInsertError } = await supabase
    .from("job_execution_logs")
    .insert({
      job_id: job.id,
      status: "running",
      started_at: startedAt.toISOString(),
    })
    .select()
    .single();

  if (logInsertError || !logRow) {
    throw logInsertError ?? new Error("Failed to create execution log");
  }

  try {
    const recordsProcessed = await runJobLogic(supabase, job);
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();

    await supabase
      .from("job_execution_logs")
      .update({
        status: "success",
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        records_processed: recordsProcessed,
      })
      .eq("id", logRow.id);

    const nextRun = job.enabled ? calculateNextRun(job.cron_schedule, completedAt) : null;

    await supabase
      .from("scheduled_jobs")
      .update({
        last_run_at: startedAt.toISOString(),
        next_run_at: job.enabled && nextRun ? nextRun.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return {
      success: true,
      recordsProcessed,
      durationMs,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      logId: logRow.id,
    };
  } catch (error) {
    const completedAt = new Date();
    const durationMs = completedAt.getTime() - startedAt.getTime();
    const message = error instanceof Error ? error.message : "Unknown error";

    await supabase
      .from("job_execution_logs")
      .update({
        status: "error",
        completed_at: completedAt.toISOString(),
        duration_ms: durationMs,
        error_message: message,
        error_stack: error instanceof Error ? error.stack : undefined,
      })
      .eq("id", logRow.id);

    const nextRun = job.enabled ? calculateNextRun(job.cron_schedule, completedAt) : null;

    await supabase
      .from("scheduled_jobs")
      .update({
        last_run_at: startedAt.toISOString(),
        next_run_at: job.enabled && nextRun ? nextRun.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", job.id);

    return {
      success: false,
      recordsProcessed: 0,
      durationMs,
      startedAt: startedAt.toISOString(),
      completedAt: completedAt.toISOString(),
      logId: logRow.id,
      error: message,
    };
  }
}
