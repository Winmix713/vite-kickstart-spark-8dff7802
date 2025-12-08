import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface HealthRow {
  component_name: string;
  status: string;
  checked_at: string;
}

interface MetricRow {
  metric_name: string;
  metric_type: string;
  value: number;
  unit: string;
  component: string;
  timestamp: string;
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

    let severity: string | null = null;
    if (req.method === "GET") {
      const { searchParams } = new URL(req.url);
      severity = searchParams.get("severity");
    } else {
      const body = await req.json().catch(() => ({}));
      severity = body?.severity ?? null;
    }

    // Load latest health per component (last 24h, then dedupe)
    const { data: healthRows, error: healthErr } = await supabase
      .from("system_health")
      .select("component_name, status, checked_at")
      .gte("checked_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order("checked_at", { ascending: false });
    if (healthErr) throw healthErr;

    const latestHealthByComponent = new Map<string, HealthRow>();
    (healthRows ?? []).forEach((r) => {
      if (!latestHealthByComponent.has(r.component_name)) {
        latestHealthByComponent.set(r.component_name, r as HealthRow);
      }
    });

    // Load recent metrics (last 2h)
    const { data: metricRows, error: metricsErr } = await supabase
      .from("performance_metrics")
      .select("metric_name, metric_type, value, unit, component, timestamp")
      .gte("timestamp", new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .order("timestamp", { ascending: false });
    if (metricsErr) throw metricsErr;

    // Find latest metrics per component for latency_p95 and error_rate
    const latestMetric = new Map<string, Map<string, MetricRow>>();
    for (const row of (metricRows ?? []) as MetricRow[]) {
      const comp = row.component;
      if (!latestMetric.has(comp)) latestMetric.set(comp, new Map());
      const perMetric = latestMetric.get(comp)!;
      if (!perMetric.has(row.metric_name)) {
        perMetric.set(row.metric_name, row);
      }
    }

    type Alert = { id: string; severity: "critical" | "warning" | "info"; message: string; component?: string; timestamp: string };
    const alerts: Alert[] = [];

    // Health based alerts
    for (const [component, hr] of latestHealthByComponent.entries()) {
      if (hr.status === "down") {
        alerts.push({ id: crypto.randomUUID(), severity: "critical", component, timestamp: hr.checked_at, message: `${component} is DOWN` });
      } else if (hr.status === "degraded") {
        alerts.push({ id: crypto.randomUUID(), severity: "warning", component, timestamp: hr.checked_at, message: `${component} is degraded` });
      }
    }

    // Metrics based alerts
    for (const [component, perMetric] of latestMetric.entries()) {
      const p95 = perMetric.get("latency_p95");
      if (p95) {
        if (p95.value >= 1200) {
          alerts.push({ id: crypto.randomUUID(), severity: "critical", component, timestamp: p95.timestamp, message: `${component} high latency p95=${Math.round(p95.value)}ms` });
        } else if (p95.value >= 800) {
          alerts.push({ id: crypto.randomUUID(), severity: "warning", component, timestamp: p95.timestamp, message: `${component} elevated latency p95=${Math.round(p95.value)}ms` });
        }
      }
      const errRate = perMetric.get("error_rate");
      if (errRate) {
        if (errRate.value >= 0.2) {
          alerts.push({ id: crypto.randomUUID(), severity: "critical", component, timestamp: errRate.timestamp, message: `${component} high error rate ${(errRate.value * 100).toFixed(1)}%` });
        } else if (errRate.value >= 0.1) {
          alerts.push({ id: crypto.randomUUID(), severity: "warning", component, timestamp: errRate.timestamp, message: `${component} elevated error rate ${(errRate.value * 100).toFixed(1)}%` });
        }
      }
    }

    alerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const filtered = severity ? alerts.filter((a) => a.severity === severity) : alerts;

    return new Response(JSON.stringify({ alerts: filtered }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("monitoring-alerts error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
