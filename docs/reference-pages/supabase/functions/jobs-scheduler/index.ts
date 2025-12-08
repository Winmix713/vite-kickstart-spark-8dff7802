import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { executeJob, type ScheduledJobRecord } from "../_shared/jobs.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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

    const cronSecret = Deno.env.get("CRON_SECRET");
    if (cronSecret) {
      const authHeader = req.headers.get("authorization");
      if (authHeader !== `Bearer ${cronSecret}`) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const nowIso = new Date().toISOString();

    const { data: dueJobsNextRun, error: dueJobsError } = await supabase
      .from("scheduled_jobs")
      .select("*")
      .eq("enabled", true)
      .or(`next_run_at.is.null,next_run_at.lte.${nowIso}`);

    if (dueJobsError) {
      throw dueJobsError;
    }

    const dueJobs = dueJobsNextRun ?? [];
    const results: Array<{ job_id: string; success: boolean; error?: string }> = [];

    for (const job of dueJobs) {
      const execution = await executeJob(supabase, job as ScheduledJobRecord);
      results.push({ job_id: job.id, success: execution.success, error: execution.error });
    }

    return new Response(
      JSON.stringify({ triggered: results.length, results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("jobs-scheduler error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
