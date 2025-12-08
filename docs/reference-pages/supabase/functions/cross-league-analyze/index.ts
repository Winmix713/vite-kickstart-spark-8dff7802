import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type MetricsKey = "goals" | "home_adv" | "balance" | "predictability" | "physicality";

function mean(values: number[]): number { return values.length ? values.reduce((a,b)=>a+b,0)/values.length : 0; }
function clamp01(x: number) { return Math.max(0, Math.min(1, x)); }

async function computeLeagueMetrics(supabase: SupabaseClient<unknown>, leagueId: string) {
  const { data: matches, error } = await supabase
    .from("matches")
    .select("home_score, away_score, match_date")
    .eq("league_id", leagueId)
    .eq("status", "finished")
    .order("match_date", { ascending: false })
    .limit(300);

  if (error) throw error;

  type MatchRow = { home_score: number | null; away_score: number | null; match_date?: string };
  const rows: MatchRow[] = (matches ?? []) as MatchRow[];
  const totals = rows.map((m) => (m.home_score ?? 0) + (m.away_score ?? 0));
  const diffs = rows.map((m) => Math.abs((m.home_score ?? 0) - (m.away_score ?? 0)));

  const avgGoals = mean(totals);
  const homeWins = rows.filter((m) => (m.home_score ?? 0) > (m.away_score ?? 0)).length;
  const awayWins = rows.filter((m) => (m.away_score ?? 0) > (m.home_score ?? 0)).length;
  const draws = rows.length - homeWins - awayWins;
  const total = rows.length || 1;

  const homeAdvIndex = (homeWins - awayWins) / total; // -1..1

  // Competitive balance: lower goal diff stddev -> more balanced
  const mDiff = mean(diffs);
  const variance = diffs.length ? diffs.reduce((acc, d) => acc + (d - mDiff) * (d - mDiff), 0) / diffs.length : 0;
  const std = Math.sqrt(variance);
  const balance = 1 - clamp01(std / 3); // normalize assuming 3 goals stddev ~ unbalanced

  // Predictability: more decisive matches (diff>=2) -> more predictable
  const decisive = diffs.filter((d) => d >= 2).length / total;
  const predictability = clamp01(decisive); // 0..1

  // Physicality proxy: lower scoring -> more physical
  const physicality = clamp01(1 - (avgGoals / 4)); // assuming 4+ avg goals is very open

  // Trend series for heatmaps and correlations
  const windowSize = 10;
  const windows: number[][] = [];
  for (let i = 0; i < rows.length; i += windowSize) {
    windows.push(rows.slice(i, i + windowSize));
  }
  const goalsSeries = windows.map((w) => mean(w.map((m) => (m.home_score ?? 0) + (m.away_score ?? 0))));
  const homeWinSeries = windows.map((w) => {
    const hw = w.filter((m) => (m.home_score ?? 0) > (m.away_score ?? 0)).length;
    const aw = w.filter((m) => (m.away_score ?? 0) > (m.home_score ?? 0)).length;
    const t = w.length || 1;
    return (hw - aw) / t;
  });

  return {
    raw: { avgGoals, homeWins, awayWins, draws, total },
    normalized: {
      goals: clamp01(avgGoals / 4) * 100,
      home_adv: clamp01((homeAdvIndex + 1) / 2) * 100,
      balance: clamp01(balance) * 100,
      predictability: clamp01(predictability) * 100,
      physicality: clamp01(physicality) * 100,
    },
    trend_data: { goals_series: goalsSeries, home_adv_series: homeWinSeries },
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check Phase 7 feature flag
  const phase7Enabled = Deno.env.get('PHASE7_ENABLED') === 'true';
  if (!phase7Enabled) {
    return new Response(
      JSON.stringify({ 
        error: 'Feature disabled',
        message: 'Phase 7 cross-league intelligence is currently disabled'
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const leagueIds: string[] = Array.isArray(body?.league_ids) ? body.league_ids : [];
    const metrics: MetricsKey[] = (Array.isArray(body?.metrics) ? body.metrics : [
      "goals",
      "home_adv",
      "balance",
      "predictability",
      "physicality",
    ]) as MetricsKey[];

    if (!leagueIds.length) {
      return new Response(JSON.stringify({ error: "league_ids is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch league names
    const { data: leagues } = await supabase
      .from("leagues")
      .select("id, name")
      .in("id", leagueIds);

    type Normalized = { goals: number; home_adv: number; balance: number; predictability: number; physicality: number };
    const results: Record<string, Normalized> = {};

    for (const leagueId of leagueIds) {
      const m = await computeLeagueMetrics(supabase, leagueId);
      results[leagueId] = m.normalized;

      // Upsert into league_characteristics as cache
      await supabase
        .from("league_characteristics")
        .upsert(
          {
            league_id: leagueId,
            avg_goals: m.raw.avgGoals,
            home_advantage_index: ((m.normalized.home_adv ?? 0) / 100) * 2 - 1,
            competitive_balance_index: (m.normalized.balance ?? 0) / 100,
            predictability_score: (m.normalized.predictability ?? 0) / 100,
            physicality_index: (m.normalized.physicality ?? 0) / 100,
            trend_data: m.trend_data,
            season: "2024-2025",
            updated_at: new Date().toISOString(),
          },
          { onConflict: "league_id,season" },
        );
    }

    // Build rankings for requested metrics
    const rankings: Record<MetricsKey, { league_id: string; score: number }[]> = {
      goals: [],
      home_adv: [],
      balance: [],
      predictability: [],
      physicality: [],
    };

    for (const metric of metrics) {
      rankings[metric] = leagueIds
        .map((l) => ({ league_id: l, score: results[l]?.[metric] ?? 0 }))
        .sort((a, b) => b.score - a.score);
    }

    // Simple correlation insights for scoring trend among selected leagues
    // We reuse cross-league-correlations function per pair, but to avoid N^2 heavy compute, only compute pairs for selected ids
    const pairs: { a: string; b: string }[] = [];
    for (let i = 0; i < leagueIds.length; i++) {
      for (let j = i + 1; j < leagueIds.length; j++) {
        pairs.push({ a: leagueIds[i], b: leagueIds[j] });
      }
    }

    const correlations: Array<{ league_a_id: string; league_b_id: string; coefficient: number }> = [];
    for (const p of pairs) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/cross-league-correlations?league_a=${p.a}&league_b=${p.b}&type=scoring_trend`, {
          headers: { Authorization: `Bearer ${supabaseKey}`, apikey: supabaseKey },
        });
        if (response.ok) {
          const json = await response.json();
          correlations.push({ league_a_id: p.a, league_b_id: p.b, coefficient: json.coefficient ?? 0 });
        }
      } catch (_err) {
        // ignore failed correlation fetch for now
      }
    }

    const insights = correlations
      .filter((c) => Number.isFinite(c.coefficient))
      .sort((a, b) => Math.abs(b.coefficient) - Math.abs(a.coefficient))
      .slice(0, 5)
      .map((c) => {
        const list = (leagues ?? []) as Array<{ id: string; name: string }>;
        const aName = list.find((l) => l.id === c.league_a_id)?.name ?? c.league_a_id;
        const bName = list.find((l) => l.id === c.league_b_id)?.name ?? c.league_b_id;
        return `${aName} vs ${bName}: scoring trend r=${(c.coefficient ?? 0).toFixed(2)}`;
      });

    return new Response(
      JSON.stringify({ leagues, metrics: results, rankings, correlations, insights }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in cross-league-analyze:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
