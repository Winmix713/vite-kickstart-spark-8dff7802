import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    let component: string | null = null;
    let metricType: string | null = null;
    let start: string | null = null;
    let end: string | null = null;

    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      component = searchParams.get("component");
      metricType = searchParams.get("metricType") ?? searchParams.get("metric_type");
      start = searchParams.get("start");
      end = searchParams.get("end");
    } else {
      const body = await req.json().catch(() => ({}));
      component = body?.component ?? null;
      metricType = body?.metricType ?? body?.metric_type ?? null;
      start = body?.start ?? null;
      end = body?.end ?? null;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Default time window: last 24h
    const startIso = start ?? new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const endIso = end ?? new Date().toISOString();

    let query = supabase
      .from("performance_metrics")
      .select("id, metric_name, metric_type, metric_category, value, unit, component, timestamp")
      .gte("timestamp", startIso)
      .lte("timestamp", endIso)
      .order("timestamp", { ascending: true });

    if (component) query = query.eq("component", component);
    if (metricType) query = query.eq("metric_type", metricType);

    const { data, error } = await query;
    if (error) throw error;

    return new Response(JSON.stringify({ metrics: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("monitoring-metrics error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
