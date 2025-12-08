import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/validation.ts";
import { 
  detectStreak,
  getHomeMatches,
  getRecentMatches,
  type GenericClient,
} from "../_shared/patterns.ts";

// Local helpers mirror functions we add for extended streaks
async function detectCleanSheetStreak(
  supabase: GenericClient,
  teamId: string,
  opts: { min_streak_length?: number; max_matches?: number } = {}
) {
  const minLen = opts.min_streak_length ?? 3;
  const max = opts.max_matches ?? 10;
  const matches = await getRecentMatches(supabase, teamId, max);
  let streak = 0;
  for (const m of matches) {
    const ga = m.home_team_id === teamId ? (m.away_score ?? 0) : (m.home_score ?? 0);
    if (ga === 0) streak++; else break;
  }
  if (streak >= minLen) {
    return {
      pattern_type: "clean_sheet_streak",
      pattern_name: "Clean Sheet Streak",
      confidence: Math.min(95, 70 + streak * 5),
      strength: Math.min(100, streak * 25),
      prediction_impact: 4,
      metadata: { streak_length: streak },
    };
  }
  return null;
}

async function detectBTTSStreak(
  supabase: GenericClient,
  teamId: string,
  opts: { min_streak_length?: number; max_matches?: number } = {}
) {
  const minLen = opts.min_streak_length ?? 3;
  const max = opts.max_matches ?? 10;
  const matches = await getRecentMatches(supabase, teamId, max);
  let streak = 0;
  for (const m of matches) {
    const gf = m.home_team_id === teamId ? (m.home_score ?? 0) : (m.away_score ?? 0);
    const ga = m.home_team_id === teamId ? (m.away_score ?? 0) : (m.home_score ?? 0);
    if (gf > 0 && ga > 0) streak++; else break;
  }
  if (streak >= minLen) {
    return {
      pattern_type: "btts_streak",
      pattern_name: "Both Teams To Score Streak",
      confidence: Math.min(90, 65 + streak * 6),
      strength: Math.min(100, streak * 22),
      prediction_impact: 3,
      metadata: { streak_length: streak },
    };
  }
  return null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: { teamId?: string; teamName?: string } = {};
    if (req.method === 'GET') {
      const url = new URL(req.url);
      body.teamId = url.searchParams.get('teamId') ?? undefined;
      body.teamName = url.searchParams.get('teamName') ?? undefined;
    } else {
      body = await req.json();
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let teamId = body.teamId ?? '';
    if (!teamId && body.teamName) {
      const { data: team, error } = await supabase
        .from('teams')
        .select('id')
        .eq('name', body.teamName)
        .maybeSingle();
      if (error || !team) throw new Error('Team not found');
      teamId = team.id as string;
    }

    if (!teamId) {
      return new Response(JSON.stringify({ error: 'Missing teamId or teamName' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const [overall, cleanSheet, btts, homeMatches] = await Promise.all([
      detectStreak(supabase as unknown as GenericClient, teamId, { min_streak_length: 3, max_matches: 10 }),
      detectCleanSheetStreak(supabase as unknown as GenericClient, teamId, { min_streak_length: 3, max_matches: 10 }),
      detectBTTSStreak(supabase as unknown as GenericClient, teamId, { min_streak_length: 3, max_matches: 10 }),
      getHomeMatches(supabase as unknown as GenericClient, teamId, 10),
    ]);

    let homeWinning: number | null = null;
    if (homeMatches.length > 0) {
      let s = 0;
      for (const m of homeMatches) {
        const homeWin = (m.home_score ?? 0) > (m.away_score ?? 0);
        if (homeWin) s++; else break;
      }
      homeWinning = s >= 3 ? s : null;
    }

    return new Response(
      JSON.stringify({
        team_id: teamId,
        streaks: {
          overall_winning: overall,
          clean_sheet: cleanSheet,
          btts: btts,
          home_winning: homeWinning,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    const message = (error as Error).message ?? 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
