import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest, JobLogsQuerySchema, corsHeaders } from "../_shared/validation.ts";
import { protectEndpoint, requireAdminOrAnalyst, createAuthErrorResponse, logAuditAction, handleCorsPreflight } from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight();
  }

  try {
    const authResult = await protectEndpoint(
      req.headers.get("Authorization"),
      requireAdminOrAnalyst
    );

    if ("error" in authResult) {
      return createAuthErrorResponse(authResult.error);
    }

    const { context } = authResult;
    const { serviceClient: supabase } = context;

    const input: { jobId: string; limit?: number } = { jobId: "", limit: 50 };

    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      input.jobId = searchParams.get("job_id") || searchParams.get("jobId") || "";
      const limitParam = searchParams.get("limit");
      if (limitParam) input.limit = Number(limitParam);
    } else if (req.method === "POST") {
      const body = await req.json();
      input.jobId = body?.jobId ?? body?.job_id ?? "";
      if (body?.limit !== undefined) input.limit = Number(body.limit);
    } else {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        {
          status: 405,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const validation = validateRequest(JobLogsQuerySchema, input);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error, details: validation.details }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { jobId, limit } = validation.data;

    const { data: logs, error } = await supabase
      .from("job_execution_logs")
      .select("id, started_at, completed_at, status, duration_ms, records_processed, error_message, error_stack")
      .eq("job_id", jobId)
      .order("started_at", { ascending: false })
      .limit(limit ?? 50);

    if (error) {
      throw error;
    }

    await logAuditAction(
      context.supabaseClient,
      context.user.id,
      "view_job_logs",
      "job",
      jobId,
      { limit: limit ?? 50 },
      context.user.email
    );

    return new Response(
      JSON.stringify({ logs: logs ?? [] }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("jobs-logs error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
