import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

export type GenericClient = SupabaseClient<Record<string, unknown>>;

export interface TeamMatch {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  match_date: string;
}

export interface DetectionResult {
  pattern_type: string;
  pattern_name: string;
  confidence: number; // 0-100
  strength: number;   // 0-100
  prediction_impact: number; // +/- impact
  metadata: Record<string, unknown>;
}

function isWinForTeam(match: TeamMatch, teamId: string): boolean {
  if (match.home_team_id === teamId) {
    if (match.home_score == null || match.away_score == null) return false;
    return match.home_score > match.away_score;
  }
  if (match.away_team_id === teamId) {
    if (match.home_score == null || match.away_score == null) return false;
    return match.away_score > match.home_score;
  }
  return false;
}

function isLossForTeam(match: TeamMatch, teamId: string): boolean {
  if (match.home_team_id === teamId) {
    if (match.home_score == null || match.away_score == null) return false;
    return match.home_score < match.away_score;
  }
  if (match.away_team_id === teamId) {
    if (match.home_score == null || match.away_score == null) return false;
    return match.away_score < match.home_score;
  }
  return false;
}

function goalsForTeam(match: TeamMatch, teamId: string): number {
  if (match.home_team_id === teamId) return match.home_score ?? 0;
  if (match.away_team_id === teamId) return match.away_score ?? 0;
  return 0;
}

function goalsAgainstTeam(match: TeamMatch, teamId: string): number {
  if (match.home_team_id === teamId) return match.away_score ?? 0;
  if (match.away_team_id === teamId) return match.home_score ?? 0;
  return 0;
}

export async function getRecentMatches(supabase: GenericClient, teamId: string, limit = 10): Promise<TeamMatch[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, home_score, away_score, match_date")
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .eq("status", "finished")
    .order("match_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentMatches error", error);
    return [];
  }
  return (data ?? []) as TeamMatch[];
}

export async function getHomeMatches(supabase: GenericClient, teamId: string, limit = 10): Promise<TeamMatch[]> {
  const { data, error } = await supabase
    .from("matches")
    .select("id, home_team_id, away_team_id, home_score, away_score, match_date")
    .eq("home_team_id", teamId)
    .eq("status", "finished")
    .order("match_date", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getHomeMatches error", error);
    return [];
  }
  return (data ?? []) as TeamMatch[];
}

export async function detectStreak(
  supabase: GenericClient,
  teamId: string,
  opts: { min_streak_length?: number; max_matches?: number } = {}
): Promise<DetectionResult | null> {
  const min_streak_length = opts.min_streak_length ?? 3;
  const max_matches = opts.max_matches ?? 10;
  const matches = await getRecentMatches(supabase, teamId, max_matches);
  if (matches.length < min_streak_length) return null;

  let streak = 0;
  const lastResults: string[] = [];
  for (const m of matches) {
    const w = isWinForTeam(m, teamId);
    const l = isLossForTeam(m, teamId);
    lastResults.push(w ? "W" : l ? "L" : "D");
    if (w) {
      if (streak >= 0) streak += 1; else break; // only consider current winning streak
    } else {
      // break on first non-win encountered at the top of the list
      break;
    }
  }

  if (streak >= min_streak_length) {
    const confidence = Math.min(95, Math.round(60 + (streak - min_streak_length + 1) * 8));
    const strength = Math.min(100, streak * 20);
    return {
      pattern_type: "winning_streak",
      pattern_name: "Winning Streak",
      confidence,
      strength,
      prediction_impact: 6,
      metadata: {
        streak_length: streak,
        min_streak: min_streak_length,
        last_results: lastResults.slice(0, Math.min(lastResults.length, 5)),
        sample_size: matches.length,
      },
    };
  }
  return null;
}

export async function detectHomeDominance(
  supabase: GenericClient,
  teamId: string,
  opts: { min_home_win_rate?: number; min_sample_size?: number; max_matches?: number } = {}
): Promise<DetectionResult | null> {
  const min_home_win_rate = opts.min_home_win_rate ?? 0.7; // 70%
  const min_sample_size = opts.min_sample_size ?? 5;
  const max_matches = opts.max_matches ?? 10;
  const matches = await getHomeMatches(supabase, teamId, max_matches);
  if (matches.length < min_sample_size) return null;

  let wins = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;
  let bttsCount = 0;

  for (const m of matches) {
    const homeWin = isWinForTeam(m, teamId);
    if (homeWin) wins += 1;
    const gf = goalsForTeam(m, teamId);
    const ga = goalsAgainstTeam(m, teamId);
    goalsFor += gf;
    goalsAgainst += ga;
    if (gf > 0 && ga > 0) bttsCount += 1;
  }

  const winRate = wins / matches.length;
  if (winRate >= min_home_win_rate) {
    const rateScore = (winRate - min_home_win_rate) / (1 - min_home_win_rate);
    const confidence = Math.min(95, Math.round(65 + Math.max(0, rateScore) * 25));
    const strength = Math.min(100, Math.round(winRate * 100) + Math.min(20, (matches.length - min_sample_size) * 3));

    return {
      pattern_type: "home_dominance",
      pattern_name: "Home Dominance",
      confidence,
      strength,
      prediction_impact: 5,
      metadata: {
        home_win_rate: Math.round(winRate * 100),
        sample_size: matches.length,
        avg_goals_for: +(goalsFor / matches.length).toFixed(2),
        avg_goals_against: +(goalsAgainst / matches.length).toFixed(2),
        both_teams_score_rate: Math.round((bttsCount / matches.length) * 100),
      },
    };
  }
  return null;
}

export async function detectHighScoring(
  supabase: GenericClient,
  teamId: string,
  opts: { min_avg_goals?: number; min_sample_size?: number; max_matches?: number } = {}
): Promise<DetectionResult | null> {
  const min_avg_goals = opts.min_avg_goals ?? 3; // per match
  const min_sample_size = opts.min_sample_size ?? 6;
  const max_matches = opts.max_matches ?? 10;
  const matches = await getRecentMatches(supabase, teamId, max_matches);
  if (matches.length < min_sample_size) return null;

  let totalGoals = 0;
  let gfTotal = 0;
  let gaTotal = 0;
  let bttsCount = 0;

  for (const m of matches) {
    const gf = goalsForTeam(m, teamId);
    const ga = goalsAgainstTeam(m, teamId);
    gfTotal += gf;
    gaTotal += ga;
    totalGoals += gf + ga;
    if (gf > 0 && ga > 0) bttsCount += 1;
  }

  const avgGoals = totalGoals / matches.length;
  if (avgGoals >= min_avg_goals) {
    const overBy = avgGoals - min_avg_goals;
    const confidence = Math.min(95, Math.round(60 + Math.min(1, overBy / 1.5) * 25));
    const strength = Math.min(100, Math.round((avgGoals / (min_avg_goals + 1.5)) * 100));

    return {
      pattern_type: "high_scoring_trend",
      pattern_name: "High Scoring",
      confidence,
      strength,
      prediction_impact: 3,
      metadata: {
        avg_goals_per_match: +avgGoals.toFixed(2),
        goals_for: gfTotal,
        goals_against: gaTotal,
        both_teams_score_rate: Math.round((bttsCount / matches.length) * 100),
        sample_size: matches.length,
      },
    };
  }

  return null;
}

export async function detectFormSurge(
  supabase: GenericClient,
  teamId: string,
  opts: { surge_threshold?: number; max_matches?: number } = {}
): Promise<DetectionResult | null> {
  const surge_threshold = opts.surge_threshold ?? 0.3; // 30% increase
  const max_matches = opts.max_matches ?? 10;
  const matches = await getRecentMatches(supabase, teamId, max_matches);
  if (matches.length < 6) return null;

  const recent = matches.slice(0, 3);
  const previous = matches.slice(3, 6);

  const calcFormIndex = (ms: TeamMatch[]): number => {
    let pts = 0;
    for (const m of ms) {
      if (isWinForTeam(m, teamId)) pts += 20;
      else if (!isLossForTeam(m, teamId)) pts += 10; // draw
    }
    // max for 3 games is 60 points
    return +(Math.min(100, (pts / 60) * 100).toFixed(2));
  };

  const recentIndex = calcFormIndex(recent);
  const prevIndex = calcFormIndex(previous);
  if (prevIndex === 0 && recentIndex < 50) {
    // avoid division explosion and false positives when previous was 0
    return null;
  }

  const increase = recentIndex - prevIndex;
  const relativeIncrease = prevIndex > 0 ? increase / prevIndex : recentIndex >= 50 ? 1 : 0;

  if (relativeIncrease >= surge_threshold && increase >= 15) {
    const confidence = Math.min(95, Math.round(62 + Math.min(1, relativeIncrease) * 23));
    const strength = Math.min(100, Math.round(recentIndex));

    return {
      pattern_type: "form_surge",
      pattern_name: "Form Surge",
      confidence,
      strength,
      prediction_impact: 4,
      metadata: {
        recent_index: recentIndex,
        previous_index: prevIndex,
        increase_absolute: +increase.toFixed(2),
        increase_relative: +relativeIncrease.toFixed(2),
        recent_sample: recent.length,
        previous_sample: previous.length,
      },
    };
  }

  return null;
}

export async function detectCleanSheetStreak(
  supabase: GenericClient,
  teamId: string,
  opts: { min_streak_length?: number; max_matches?: number } = {}
): Promise<DetectionResult | null> {
  const min_streak_length = opts.min_streak_length ?? 3;
  const max_matches = opts.max_matches ?? 10;
  const matches = await getRecentMatches(supabase, teamId, max_matches);
  if (matches.length < min_streak_length) return null;

  let streak = 0;
  for (const m of matches) {
    const ga = goalsAgainstTeam(m, teamId);
    if (ga === 0) streak += 1; else break;
  }

  if (streak >= min_streak_length) {
    const confidence = Math.min(95, 70 + streak * 5);
    const strength = Math.min(100, streak * 25);
    return {
      pattern_type: "clean_sheet_streak",
      pattern_name: "Clean Sheet Streak",
      confidence,
      strength,
      prediction_impact: 4,
      metadata: { streak_length: streak, min_streak: min_streak_length, sample_size: matches.length },
    };
  }
  return null;
}

export async function detectBTTSStreak(
  supabase: GenericClient,
  teamId: string,
  opts: { min_streak_length?: number; max_matches?: number } = {}
): Promise<DetectionResult | null> {
  const min_streak_length = opts.min_streak_length ?? 3;
  const max_matches = opts.max_matches ?? 10;
  const matches = await getRecentMatches(supabase, teamId, max_matches);
  if (matches.length < min_streak_length) return null;

  let streak = 0;
  for (const m of matches) {
    const gf = goalsForTeam(m, teamId);
    const ga = goalsAgainstTeam(m, teamId);
    if (gf > 0 && ga > 0) streak += 1; else break;
  }

  if (streak >= min_streak_length) {
    const confidence = Math.min(90, 65 + streak * 6);
    const strength = Math.min(100, streak * 22);
    return {
      pattern_type: "btts_streak",
      pattern_name: "Both Teams To Score Streak",
      confidence,
      strength,
      prediction_impact: 3,
      metadata: { streak_length: streak, min_streak: min_streak_length, sample_size: matches.length },
    };
  }
  return null;
}

export type DetectionFunctionKey = "winning_streak" | "home_dominance" | "high_scoring_trend" | "form_surge";

export async function runDetections(
  supabase: GenericClient,
  teamId: string,
  which?: DetectionFunctionKey[]
): Promise<DetectionResult[]> {
  const target = new Set(which ?? ["winning_streak", "home_dominance", "high_scoring_trend", "form_surge"]);

  const results: (DetectionResult | null)[] = await Promise.all([
    target.has("winning_streak") ? detectStreak(supabase, teamId) : Promise.resolve(null),
    target.has("home_dominance") ? detectHomeDominance(supabase, teamId) : Promise.resolve(null),
    target.has("high_scoring_trend") ? detectHighScoring(supabase, teamId) : Promise.resolve(null),
    target.has("form_surge") ? detectFormSurge(supabase, teamId) : Promise.resolve(null),
  ]);

  return results.filter((r): r is DetectionResult => r !== null);
}
