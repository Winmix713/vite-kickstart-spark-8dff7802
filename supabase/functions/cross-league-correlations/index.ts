import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SeriesResult {
  series: number[];
  sampleSize: number;
}

function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length <= 1) return 0;
  const m = mean(values);
  const variance = values.reduce((acc, v) => acc + (v - m) * (v - m), 0) / (values.length - 1);
  return Math.sqrt(variance);
}

function pearson(x: number[], y: number[]): { r: number; n: number } {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { r: 0, n };
  const xs = x.slice(0, n);
  const ys = y.slice(0, n);
  const meanX = mean(xs);
  const meanY = mean(ys);
  let num = 0;
  let denomX = 0;
  let denomY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX;
    const dy = ys[i] - meanY;
    num += dx * dy;
    denomX += dx * dx;
    denomY += dy * dy;
  }
  const denom = Math.sqrt(denomX * denomY);
  const r = denom === 0 ? 0 : num / denom;
  return { r, n };
}

async function scoringTrendSeries(supabase: SupabaseClient<unknown>, leagueId: string, windowSize = 10, maxWindows = 12): Promise<SeriesResult> {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("home_score, away_score, match_date")
    .eq("league_id", leagueId)
    .eq("status", "finished")
    .order("match_date", { ascending: true })
    .limit(windowSize * maxWindows);

  if (error) {
    console.error("Failed to fetch matches for scoring series", error);
    return { series: [], sampleSize: 0 };
  }

  const windows = chunk((matches ?? []) as Array<{ home_score: number | null; away_score: number | null; match_date: string }>, windowSize);
  const series = windows.map((w) => {
    const goals = w.map((m) => (m.home_score ?? 0) + (m.away_score ?? 0));
    return goals.length ? mean(goals) : 0;
  });

  return { series, sampleSize: series.length };
}

async function homeAdvantageSeries(supabase: SupabaseClient<unknown>, leagueId: string, windowSize = 20, maxWindows = 10): Promise<SeriesResult> {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("home_score, away_score, match_date")
    .eq("league_id", leagueId)
    .eq("status", "finished")
    .order("match_date", { ascending: true })
    .limit(windowSize * maxWindows);

  if (error) {
    console.error("Failed to fetch matches for home advantage series", error);
    return { series: [], sampleSize: 0 };
  }

  const windows = chunk((matches ?? []) as Array<{ home_score: number | null; away_score: number | null; match_date: string }>, windowSize);
  const series = windows.map((w) => {
    if (w.length === 0) return 0;
    const homeWins = w.filter((m) => (m.home_score ?? 0) > (m.away_score ?? 0)).length;
    const awayWins = w.filter((m) => (m.away_score ?? 0) > (m.home_score ?? 0)).length;
    const total = w.length;
    return total ? (homeWins - awayWins) / total : 0; // -1..1 scale
  });

  return { series, sampleSize: series.length };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const url = new URL(req.url);
    const leagueA = url.searchParams.get("league_a");
    const leagueB = url.searchParams.get("league_b");
    const type = (url.searchParams.get("type") ?? "scoring_trend") as
      | "scoring_trend"
      | "home_advantage"
      | "form_impact";

    if (req.method !== "GET" && req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let bodyLeagueA: string | null = null;
    let bodyLeagueB: string | null = null;
    let bodyType: "scoring_trend" | "home_advantage" | "form_impact" | null = null;

    if (req.method === "POST") {
      try {
        const payload = await req.json();
        bodyLeagueA = payload?.league_a ?? null;
        bodyLeagueB = payload?.league_b ?? null;
        bodyType = payload?.type ?? null;
      } catch (_) {
        // ignore
      }
    }

    const a = (bodyLeagueA ?? leagueA) as string | null;
    const b = (bodyLeagueB ?? leagueB) as string | null;
    const t = (bodyType ?? type) as "scoring_trend" | "home_advantage" | "form_impact";

    if (a && b) {
      let seriesA: SeriesResult = { series: [], sampleSize: 0 };
      let seriesB: SeriesResult = { series: [], sampleSize: 0 };

      if (t === "scoring_trend") {
        seriesA = await scoringTrendSeries(supabase, a);
        seriesB = await scoringTrendSeries(supabase, b);
      } else if (t === "home_advantage") {
        seriesA = await homeAdvantageSeries(supabase, a);
        seriesB = await homeAdvantageSeries(supabase, b);
      } else {
        // Placeholder for form_impact - fall back to home advantage for now
        seriesA = await homeAdvantageSeries(supabase, a);
        seriesB = await homeAdvantageSeries(supabase, b);
      }

      const minLen = Math.min(seriesA.series.length, seriesB.series.length);
      const x = seriesA.series.slice(0, minLen);
      const y = seriesB.series.slice(0, minLen);
      const { r, n } = pearson(x, y);

      const { data: leagueNames } = await supabase
        .from("leagues")
        .select("id, name")
        .in("id", [a, b]);

      const list = (leagueNames ?? []) as Array<{ id: string; name: string }>;
      const aName = list.find((l) => l.id === a)?.name ?? "League A";
      const bName = list.find((l) => l.id === b)?.name ?? "League B";

      const insight = `${aName} és ${bName} ${t.replace("_", " ")} mintázata ${(r >= 0 ? "pozitívan" : "negatívan")} korrelál (r=${r.toFixed(2)})`;

      await supabase
        .from("cross_league_correlations")
        .upsert(
          {
            league_a_id: a,
            league_b_id: b,
            correlation_type: t,
            coefficient: Number.isFinite(r) ? r : 0,
            p_value: null,
            sample_size: n,
            insight_summary: insight,
            last_calculated: new Date().toISOString(),
          },
          { onConflict: "league_a_id,league_b_id,correlation_type" },
        );

      return new Response(
        JSON.stringify({
          league_a_id: a,
          league_b_id: b,
          correlation_type: t,
          coefficient: r,
          p_value: null,
          sample_size: n,
          insight_summary: insight,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // No pair specified: return all cached correlations and league labels
    const { data: correlations, error: corrError } = await supabase
      .from("cross_league_correlations")
      .select("league_a_id, league_b_id, correlation_type, coefficient, sample_size");

    if (corrError) {
      throw corrError;
    }

    const { data: leagues, error: leaguesError } = await supabase
      .from("leagues")
      .select("id, name");

    if (leaguesError) {
      throw leaguesError;
    }

    return new Response(
      JSON.stringify({ leagues, correlations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in cross-league-correlations:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
