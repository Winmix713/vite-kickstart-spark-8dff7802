import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest, JobToggleSchema, corsHeaders } from "../_shared/validation.ts";
import {
  protectEndpoint,
  requireAdminOrAnalyst,
  createAuthErrorResponse,
  logAuditAction,
  handleCorsPreflight
} from "../_shared/auth.ts";
import { calculateNextRun, type ScheduledJobRecord } from "../_shared/jobs.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight();
  }

  try {
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Authenticate and authorize the request (admin or analyst)
    const authResult = await protectEndpoint(
      req.headers.get("Authorization"),
      requireAdminOrAnalyst
    );

    if ("error" in authResult) {
      return createAuthErrorResponse(authResult.error);
    }

    const { context } = authResult;
    const { serviceClient: supabase } = context;

    const body = await req.json();
    const validation = validateRequest(JobToggleSchema, body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error, details: validation.details }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { jobId, enabled } = validation.data;

    const { data: job, error: jobError } = await supabase
      .from("scheduled_jobs")
      .select("*")
      .eq("id", jobId)
      .maybeSingle<ScheduledJobRecord>();

    if (jobError) {
      throw jobError;
    }

    if (!job) {
      return new Response(
        JSON.stringify({ error: "Job not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const nextRun = enabled ? calculateNextRun(job.cron_schedule, new Date()) : null;

    const { data: updatedJob, error: updateError } = await supabase
      .from("scheduled_jobs")
      .update({
        enabled,
        next_run_at: enabled && nextRun ? nextRun.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", jobId)
      .select("*")
      .single();

    if (updateError) {
      throw updateError;
    }

    // Log the action for audit
    await logAuditAction(
      context.supabaseClient,
      context.user.id,
      "toggle_job",
      "job",
      jobId,
      {
        job_name: job.job_name,
        job_type: job.job_type,
        enabled,
        next_run_at: updatedJob?.next_run_at ?? null,
      },
      context.user.email
    );

    return new Response(
      JSON.stringify({ job: { ...updatedJob, config: updatedJob?.config ?? {} } }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("jobs-toggle error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
