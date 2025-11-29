import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { executeJob, type ScheduledJobRecord } from "../_shared/jobs.ts";
import { validateRequest, JobTriggerSchema, corsHeaders } from "../_shared/validation.ts";
import { 
  protectEndpoint, 
  requireAdminOrAnalyst, 
  createAuthErrorResponse, 
  logAuditAction,
  handleCorsPreflight 
} from "../_shared/auth.ts";

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

    // Authenticate and authorize the request
    const authResult = await protectEndpoint(
      req.headers.get('Authorization'),
      requireAdminOrAnalyst
    );

    if ('error' in authResult) {
      return createAuthErrorResponse(authResult.error);
    }

    const { context } = authResult;
    const { serviceClient: supabase } = context;

    const body = await req.json();
    const validation = validateRequest(JobTriggerSchema, body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error, details: validation.details }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { jobId, force } = validation.data;

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

    const result = await executeJob(supabase, job, { force });

    // Log the action for audit
    await logAuditAction(
      context.supabaseClient,
      context.user.id,
      'trigger_job',
      'job',
      jobId,
      {
        job_name: job.job_name,
        job_type: job.job_type,
        force,
        success: result.success,
        error: result.error
      },
      context.user.email
    );

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error ?? "Job execution failed", result }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({ result }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("jobs-trigger error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
