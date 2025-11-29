import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SystemHealthRow {
  id: string;
  component_name: string;
  component_type: string;
  status: "healthy" | "degraded" | "down" | string;
  response_time_ms: number | null;
  error_rate: number | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  checked_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Check Phase 8 feature flag
  const phase8Enabled = Deno.env.get('PHASE8_ENABLED') === 'true';
  if (!phase8Enabled) {
    return new Response(
      JSON.stringify({ 
        error: 'Feature disabled',
        message: 'Phase 8 monitoring & visualization is currently disabled'
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load recent health snapshots (last 24h), then reduce to latest per component
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from("system_health")
      .select("*")
      .gte("checked_at", twentyFourHoursAgo)
      .order("checked_at", { ascending: false });

    if (error) throw error;

    const latestByComponent = new Map<string, SystemHealthRow>();
    (data ?? []).forEach((row: SystemHealthRow) => {
      const key = row.component_name;
      if (!latestByComponent.has(key)) {
        latestByComponent.set(key, row);
      }
    });

    const components = Array.from(latestByComponent.values());

    const statusCounts = components.reduce(
      (acc, row) => {
        const s = row.status as "healthy" | "degraded" | "down" | string;
        if (s === "healthy") acc.healthy += 1;
        else if (s === "degraded") acc.degraded += 1;
        else if (s === "down") acc.down += 1;
        else acc.unknown += 1;
        return acc;
      },
      { healthy: 0, degraded: 0, down: 0, unknown: 0 },
    );

    const response = { components, status_counts: statusCounts, updated_at: new Date().toISOString() };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("monitoring-health error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
