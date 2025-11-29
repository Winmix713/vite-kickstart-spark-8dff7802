import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GraphRow {
  node_id: string;
  node_name: string;
  node_type: string;
  dependencies: string[] | null;
  execution_time_ms: number | null;
  position_x: number | null;
  position_y: number | null;
  status: string;
  last_run: string | null;
}

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

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from("computation_graph")
      .select("node_id, node_name, node_type, dependencies, execution_time_ms, position_x, position_y, status, last_run")
      .order("node_id", { ascending: true });

    if (error) throw error;

    const rows: GraphRow[] = data ?? [];

    const nodes = rows.map((r) => ({
      id: r.node_id,
      data: {
        label: r.node_name,
        status: r.status,
        nodeType: r.node_type,
        executionTimeMs: r.execution_time_ms,
        lastRun: r.last_run,
      },
      position: { x: r.position_x ?? 0, y: r.position_y ?? 0 },
    }));

    const edges: Array<{ id: string; source: string; target: string }> = [];
    for (const r of rows) {
      const deps = Array.isArray(r.dependencies) ? r.dependencies : [];
      for (const dep of deps) {
        edges.push({ id: `${dep}-${r.node_id}`, source: dep, target: r.node_id });
      }
    }

    return new Response(JSON.stringify({ nodes, edges }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("monitoring-computation-graph error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
