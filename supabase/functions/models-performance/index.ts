import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PerfPoint { date: string; overall: number; home_win: number; draw: number; away_win: number }

function formatDate(dateIso: string): string {
  const d = new Date(dateIso);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "GET") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const version = url.searchParams.get("version") ?? "v1";
    const start = url.searchParams.get("start") ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const end = url.searchParams.get("end") ?? new Date().toISOString();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // For Phase 4, we treat all predictions as model "version"
    const { data, error } = await supabase
      .from("predictions")
      .select("created_at, predicted_outcome, was_correct, css_score, confidence_score")
      .gte("created_at", start)
      .lte("created_at", end)
      .order("created_at", { ascending: true });

    if (error) {
      throw error;
    }

    type PredRow = {
      created_at: string;
      predicted_outcome: "home_win" | "draw" | "away_win" | string;
      was_correct: boolean | null;
      css_score: number | null;
      confidence_score: number;
    };

    const rows: PredRow[] = (data as PredRow[]) ?? [];

    // Summary stats
    const evaluated: PredRow[] = rows.filter((r) => r.was_correct !== null);
    const total_predictions = evaluated.length;
    const correct = evaluated.filter((r) => r.was_correct === true).length;
    const accuracy_overall = total_predictions > 0 ? Math.round((correct / total_predictions) * 10000) / 100 : 0;

    const calibrationErrors: number[] = evaluated.map((r) => {
      const p = ((r.css_score ?? r.confidence_score) as number) / 100;
      const y = r.was_correct ? 1 : 0;
      return Math.abs(p - y);
    });
    const meanCalibrationError = calibrationErrors.length > 0
      ? calibrationErrors.reduce((a: number, b: number) => a + b, 0) / calibrationErrors.length
      : 0;
    const confidence_calibration_score = Math.round((1 - meanCalibrationError) * 1000) / 1000; // 1 is best

    // Time series by day
    const byDate = new Map<string, PredRow[]>();
    for (const r of rows) {
      const key = formatDate(r.created_at);
      if (!byDate.has(key)) byDate.set(key, []);
      byDate.get(key)!.push(r);
    }

    const points: PerfPoint[] = Array.from(byDate.keys()).sort().map((day) => {
      const items: PredRow[] = byDate.get(day)!;
      const evals: PredRow[] = items.filter((i) => i.was_correct !== null);
      const calcAcc = (subset: PredRow[]) => {
        const t = subset.length;
        const c = subset.filter((i) => i.was_correct === true).length;
        return t > 0 ? (c / t) * 100 : 0;
      };
      return {
        date: day,
        overall: calcAcc(evals),
        home_win: calcAcc(evals.filter((i) => i.predicted_outcome === "home_win")),
        draw: calcAcc(evals.filter((i) => i.predicted_outcome === "draw")),
        away_win: calcAcc(evals.filter((i) => i.predicted_outcome === "away_win")),
      };
    });

    // Optionally upsert a summary row
    await supabase.from("model_performance").upsert({
      model_version: version,
      period_start: new Date(start).toISOString(),
      period_end: new Date(end).toISOString(),
      total_predictions,
      accuracy_overall,
      accuracy_winner: accuracy_overall,
      accuracy_btts: null,
      confidence_calibration_score,
      league_breakdown: {},
    }, { onConflict: "model_version,period_start,period_end" });

    return new Response(
      JSON.stringify({
        summary: {
          model_version: version,
          period_start: start,
          period_end: end,
          total_predictions,
          accuracy_overall,
          confidence_calibration_score,
        },
        timeseries: points,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("models-performance error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
