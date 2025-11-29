import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { corsHeaders } from "../_shared/validation.ts";

type Outcome = 'H' | 'D' | 'V';

type MatchRow = {
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
};

function extractOutcomes(matches: MatchRow[], teamId: string): Outcome[] {
  return matches.map((m) => {
    const isHome = m.home_team_id === teamId;
    const teamScore = isHome ? (m.home_score ?? 0) : (m.away_score ?? 0);
    const oppScore = isHome ? (m.away_score ?? 0) : (m.home_score ?? 0);

    if (teamScore > oppScore) return 'H';
    if (teamScore < oppScore) return 'V';
    return 'D';
  });
}

function buildTransition(outcomes: Outcome[]) {
  const idx: Record<Outcome, number> = { H: 0, D: 1, V: 2 };
  const counts: number[][] = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
  for (let i = 0; i < outcomes.length - 1; i++) {
    counts[idx[outcomes[i]]][idx[outcomes[i + 1]]]++;
  }
  const K = 3;
  const matrix = counts.map((row) => {
    const total = row.reduce((a, b) => a + b, 0);
    return row.map((c) => (c + 1) / (total + K));
  });
  return { counts, matrix, sampleSize: Math.max(0, outcomes.length - 1) };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let body: { teamId?: string; teamName?: string; maxMatches?: number } = {};
    if (req.method === 'GET') {
      const url = new URL(req.url);
      body.teamId = url.searchParams.get('teamId') ?? undefined;
      body.teamName = url.searchParams.get('teamName') ?? undefined;
      const mm = url.searchParams.get('maxMatches');
      body.maxMatches = mm ? Number(mm) : undefined;
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

    const maxMatches = Math.max(5, Math.min(50, body.maxMatches ?? 20));

    const { data: matches, error } = await supabase
      .from('matches')
      .select('id,home_team_id,away_team_id,home_score,away_score,match_date')
      .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
      .eq('status', 'finished')
      .order('match_date', { ascending: false })
      .limit(maxMatches);

    if (error || !Array.isArray(matches)) throw new Error(error?.message ?? 'Failed to load matches');

    const outcomes = extractOutcomes(matches, teamId);
    const transition = buildTransition(outcomes);

    const confidence: 'low' | 'medium' | 'high' = transition.sampleSize < 10 ? 'low' : transition.sampleSize < 20 ? 'medium' : 'high';

    return new Response(
      JSON.stringify({ team_id: teamId, ...transition, confidence }),
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
