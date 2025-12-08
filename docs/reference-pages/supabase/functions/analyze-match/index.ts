import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { validateRequest, MatchIdSchema, corsHeaders } from "../_shared/validation.ts";
import { 
  protectEndpoint, 
  requireAdminOrAnalyst, 
  createAuthErrorResponse, 
  logAuditAction,
  handleCorsPreflight 
} from "../_shared/auth.ts";
import { 
  generatePredictionId, 
  logPredictionEvent, 
  getModelVersion 
} from "../_shared/evaluation-logging.ts";
import { EnsemblePredictor, type EnsemblePredictionInput } from "../_shared/ensemble.ts";

interface MatchResult {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  full_time_home_goals?: number | null;
  full_time_away_goals?: number | null;
  half_time_home_score?: number | null;
  half_time_away_score?: number | null;
  half_time_home_goals?: number | null;
  half_time_away_goals?: number | null;
  match_date: string;
}

interface Pattern {
  template_name: string;
  confidence_boost: number;
  data: Record<string, unknown>;
}

type ModelOutcome = 'home_win' | 'draw' | 'away_win';

interface SubModelPrediction {
  prediction: ModelOutcome;
  confidence: number;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

const getFirstNumber = (...values: Array<number | null | undefined>): number | undefined => {
  for (const value of values) {
    if (typeof value === 'number' && !Number.isNaN(value)) {
      return value;
    }
  }
  return undefined;
};

const resolveHalfTimeScore = (match: MatchResult, forHomeSide: boolean): number => {
  const primary = getFirstNumber(
    forHomeSide ? match.half_time_home_score : match.half_time_away_score,
    forHomeSide ? match.half_time_home_goals : match.half_time_away_goals
  );

  if (primary !== undefined) {
    return primary;
  }

  const fallback = getFirstNumber(
    forHomeSide ? match.home_score : match.away_score,
    forHomeSide ? match.full_time_home_goals : match.full_time_away_goals
  );

  if (fallback !== undefined) {
    return Math.max(0, Math.round(fallback / 2));
  }

  return 0;
};

const calculateTeamHalfTimeDifferential = (matches: MatchResult[], teamId: string): number => {
  if (!matches.length) return 0;

  let totalDiff = 0;
  let samples = 0;

  matches.forEach(match => {
    const isHomeTeam = match.home_team_id === teamId;
    const isAwayTeam = match.away_team_id === teamId;

    if (!isHomeTeam && !isAwayTeam) {
      return;
    }

    const teamScore = resolveHalfTimeScore(match, isHomeTeam);
    const opponentScore = resolveHalfTimeScore(match, !isHomeTeam);
    totalDiff += teamScore - opponentScore;
    samples += 1;
  });

  return samples > 0 ? totalDiff / samples : 0;
};

const calculateFullTimeModelPrediction = (
  homeFormScore: number,
  awayFormScore: number,
  h2hMatches: MatchResult[],
  homeTeamId: string,
  awayTeamId: string
): SubModelPrediction => {
  const normalizedFormDiff = clamp((homeFormScore - awayFormScore) / 100, -1, 1);

  let homeH2HWins = 0;
  let awayH2HWins = 0;

  h2hMatches.forEach(match => {
    const homeScore = getFirstNumber(match.home_score, match.full_time_home_goals);
    const awayScore = getFirstNumber(match.away_score, match.full_time_away_goals);
    if (homeScore === undefined || awayScore === undefined || homeScore === awayScore) {
      return;
    }

    if (homeScore > awayScore) {
      if (match.home_team_id === homeTeamId) {
        homeH2HWins += 1;
      } else if (match.home_team_id === awayTeamId) {
        awayH2HWins += 1;
      }
    } else if (awayScore > homeScore) {
      if (match.away_team_id === homeTeamId) {
        homeH2HWins += 1;
      } else if (match.away_team_id === awayTeamId) {
        awayH2HWins += 1;
      }
    }
  });

  const totalH2H = homeH2HWins + awayH2HWins;
  const h2hDiff = totalH2H > 0 ? clamp((homeH2HWins - awayH2HWins) / totalH2H, -1, 1) : 0;

  const combinedScore = clamp(normalizedFormDiff * 0.7 + h2hDiff * 0.3, -1, 1);
  const magnitude = Math.abs(combinedScore);

  let prediction: ModelOutcome = 'draw';
  if (combinedScore > 0.08) {
    prediction = 'home_win';
  } else if (combinedScore < -0.08) {
    prediction = 'away_win';
  } else if (Math.abs(combinedScore) <= 0.03) {
    prediction = 'draw';
  } else {
    prediction = combinedScore > 0 ? 'home_win' : 'away_win';
  }

  const confidence = prediction === 'draw'
    ? clamp(0.45 - magnitude * 0.2 + 0.35, 0.4, 0.6)
    : clamp(0.55 + magnitude * 0.5, 0.55, 0.92);

  return {
    prediction,
    confidence: Number(confidence.toFixed(4))
  };
};

const calculateHalfTimeModelPrediction = (
  homeRecentMatches: MatchResult[],
  awayRecentMatches: MatchResult[],
  homeTeamId: string,
  awayTeamId: string
): SubModelPrediction => {
  const homeDifferential = calculateTeamHalfTimeDifferential(homeRecentMatches, homeTeamId);
  const awayDifferential = calculateTeamHalfTimeDifferential(awayRecentMatches, awayTeamId);
  const normalizedDiff = clamp((homeDifferential - awayDifferential) / 2, -1, 1);
  const magnitude = Math.abs(normalizedDiff);

  let prediction: ModelOutcome = 'draw';
  if (normalizedDiff > 0.12) {
    prediction = 'home_win';
  } else if (normalizedDiff < -0.12) {
    prediction = 'away_win';
  } else if (magnitude < 0.04) {
    prediction = 'draw';
  } else {
    prediction = normalizedDiff > 0 ? 'home_win' : 'away_win';
  }

  const confidence = prediction === 'draw'
    ? clamp(0.42 + (0.12 - magnitude) * 0.4, 0.35, 0.55)
    : clamp(0.5 + magnitude * 0.45, 0.5, 0.8);

  return {
    prediction,
    confidence: Number(confidence.toFixed(4))
  };
};

const calculatePatternModelPrediction = (patterns: Pattern[]): SubModelPrediction => {
  if (!patterns.length) {
    return {
      prediction: 'draw',
      confidence: 0.45
    };
  }

  const homeBoost = patterns
    .filter(p => p.template_name.includes('home') || p.template_name === 'h2h_dominance' || p.template_name === 'recent_form_advantage')
    .reduce((sum, p) => sum + p.confidence_boost, 0);

  const awayBoost = patterns
    .filter(p => p.template_name.includes('away'))
    .reduce((sum, p) => sum + p.confidence_boost, 0);

  const neutralBoost = patterns
    .filter(p => !p.template_name.includes('home') && !p.template_name.includes('away'))
    .reduce((sum, p) => sum + p.confidence_boost, 0);

  const totalBoost = homeBoost + awayBoost + neutralBoost;
  const diff = homeBoost - awayBoost;

  let prediction: ModelOutcome = 'draw';
  if (diff > 4) {
    prediction = 'home_win';
  } else if (diff < -4) {
    prediction = 'away_win';
  }

  const normalizedTotal = clamp(totalBoost / 80, 0, 0.35);
  const normalizedDiff = clamp(Math.abs(diff) / 40, 0, 0.4);

  const confidence = prediction === 'draw'
    ? clamp(0.45 + normalizedTotal * 0.5, 0.4, 0.65)
    : clamp(0.52 + normalizedTotal + normalizedDiff, 0.52, 0.9);

  return {
    prediction,
    confidence: Number(confidence.toFixed(4))
  };
};

const formatEnsembleConflictReason = (margin: number): string => {
  return `Ensemble konfliktus: a két legmagasabb pontszám közötti különbség ${(margin * 100).toFixed(1)}% (küszöb: 10%).`;
};

// Helper: Get recent matches for a team
async function getRecentMatches(
  supabase: SupabaseClient,
  teamId: string,
  limit: number
): Promise<MatchResult[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`home_team_id.eq.${teamId},away_team_id.eq.${teamId}`)
    .eq('status', 'finished')
    .order('match_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent matches:', error);
    return [];
  }

  return data || [];
}

// Helper: Get H2H matches between two teams
async function getH2HMatches(
  supabase: SupabaseClient,
  team1Id: string,
  team2Id: string,
  limit: number
): Promise<MatchResult[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .or(`and(home_team_id.eq.${team1Id},away_team_id.eq.${team2Id}),and(home_team_id.eq.${team2Id},away_team_id.eq.${team1Id})`)
    .eq('status', 'finished')
    .order('match_date', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching H2H matches:', error);
    return [];
  }

  return data || [];
}

// Helper: Calculate form score (0-100)
function calculateFormScore(matches: MatchResult[], teamId: string): number {
  if (matches.length === 0) return 50; // Neutral if no data

  let score = 0;
  matches.forEach(match => {
    const isHome = match.home_team_id === teamId;
    const teamScore = isHome ? (match.home_score ?? match.full_time_home_goals ?? 0) : (match.away_score ?? match.full_time_away_goals ?? 0);
    const opponentScore = isHome ? (match.away_score ?? match.full_time_away_goals ?? 0) : (match.home_score ?? match.full_time_home_goals ?? 0);

    if (teamScore > opponentScore) score += 20; // Win
    else if (teamScore === opponentScore) score += 10; // Draw
    // Loss = 0 points
  });

  return Math.min(score, 100);
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight();
  }

  try {
    // Authenticate and authorize the request
    const authResult = await protectEndpoint(
      req.headers.get('Authorization'),
      requireAdminOrAnalyst
    );

    if ('error' in authResult) {
      return createAuthErrorResponse(authResult.error);
    }

    const { context } = authResult;
    const { serviceClient: supabase } = context;

    // Validate input
    const body = await req.json()
    const validation = validateRequest(MatchIdSchema, body)
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error, details: validation.details }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { matchId } = validation.data

    // Generate unique prediction ID for tracking
    const predictionId = generatePredictionId();
    console.log(`🆔 Generated prediction ID: ${predictionId} for match: ${matchId}`);

    // Get current model version
    const modelVersion = await getModelVersion();

    // 1. Fetch match details
    const { data: match, error: matchError } = await supabase
      .from('matches')
      .select(`
        *,
        home_team:teams!home_team_id(id, name),
        away_team:teams!away_team_id(id, name),
        league:leagues(id, name, avg_goals_per_match)
      `)
      .eq('id', matchId)
      .single();

    if (matchError || !match) {
      console.error('Match not found:', matchError);
      return new Response(
        JSON.stringify({ error: 'Match not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Fetch recent form (last 5 matches for each team)
    const homeRecentMatches = await getRecentMatches(supabase, match.home_team.id, 5);
    const awayRecentMatches = await getRecentMatches(supabase, match.away_team.id, 5);

    // 3. Fetch H2H history
    const h2hMatches = await getH2HMatches(supabase, match.home_team.id, match.away_team.id, 5);

    // 4. Detect patterns
    const detectedPatterns: Pattern[] = [];

    // Pattern 1: Home winning streak (home matches only)
    const homeHomeMatches = homeRecentMatches.filter(m => m.home_team_id === match.home_team.id);
    const homeWins = homeHomeMatches.filter(m => m.home_score > m.away_score).length;
    if (homeWins >= 3) {
      detectedPatterns.push({
        template_name: 'home_winning_streak',
        confidence_boost: 8.0,
        data: { wins: homeWins, total: homeHomeMatches.length }
      });
    }

    // Pattern 2: Away winning streak (away matches only)
    const awayAwayMatches = awayRecentMatches.filter(m => m.away_team_id === match.away_team.id);
    const awayWins = awayAwayMatches.filter(m => m.away_score > m.home_score).length;
    if (awayWins >= 3) {
      detectedPatterns.push({
        template_name: 'away_winning_streak',
        confidence_boost: 7.0,
        data: { wins: awayWins, total: awayAwayMatches.length }
      });
    }

    // Pattern 3: H2H dominance
    if (h2hMatches.length >= 3) {
      const homeH2HWins = h2hMatches.filter(m => {
        const isHomeInH2H = m.home_team_id === match.home_team.id;
        return isHomeInH2H 
          ? m.home_score > m.away_score 
          : m.away_score > m.home_score;
      }).length;

      if (homeH2HWins >= 3) {
        detectedPatterns.push({
          template_name: 'h2h_dominance',
          confidence_boost: 10.0,
          data: { home_wins: homeH2HWins, total: h2hMatches.length }
        });
      }
    }

    // Pattern 4: Recent form advantage
    const homeFormScore = calculateFormScore(homeRecentMatches, match.home_team.id);
    const awayFormScore = calculateFormScore(awayRecentMatches, match.away_team.id);
    
    if (homeFormScore - awayFormScore >= 40) { // 2+ more wins
      detectedPatterns.push({
        template_name: 'recent_form_advantage',
        confidence_boost: 6.0,
        data: { home_form: homeFormScore, away_form: awayFormScore }
      });
    }

    // Pattern 5: High scoring league
    if (match.league.avg_goals_per_match > 3.0) {
      detectedPatterns.push({
        template_name: 'high_scoring_league',
        confidence_boost: 3.0,
        data: { avg_goals: match.league.avg_goals_per_match }
      });
    }

    // 5. Generate sub-model predictions for ensemble
    const fullTimeModel = calculateFullTimeModelPrediction(
      homeFormScore,
      awayFormScore,
      h2hMatches,
      match.home_team.id,
      match.away_team.id
    );
    
    const halfTimeModel = calculateHalfTimeModelPrediction(
      homeRecentMatches,
      awayRecentMatches,
      match.home_team.id,
      match.away_team.id
    );
    
    const patternModel = calculatePatternModelPrediction(detectedPatterns);
    
    console.log('🔍 Sub-model predictions:', {
      fullTime: fullTimeModel,
      halfTime: halfTimeModel,
      pattern: patternModel
    });
    
    // 6. Run ensemble predictor
    const ensemblePredictor = new EnsemblePredictor();
    const ensembleResult = ensemblePredictor.predict({
      full_time_prediction: fullTimeModel.prediction,
      full_time_confidence: fullTimeModel.confidence,
      half_time_prediction: halfTimeModel.prediction,
      half_time_confidence: halfTimeModel.confidence,
      pattern_prediction: patternModel.prediction,
      pattern_confidence: patternModel.confidence
    });
    
    const predictedOutcome = ensembleResult.winner;
    const confidencePercent = Number((ensembleResult.final_confidence * 100).toFixed(2));
    const predictionStatus = ensembleResult.conflict_detected ? 'uncertain' : 'active';
    const blockedReason = ensembleResult.conflict_detected ? formatEnsembleConflictReason(ensembleResult.conflict_margin) : null;

    const orderedScores = (Object.entries(ensembleResult.scores) as Array<[keyof typeof ensembleResult.scores, number]>)
      .sort((a, b) => b[1] - a[1]);
    const alternateOutcome: ModelOutcome | null = ensembleResult.conflict_detected && orderedScores.length > 1
      ? (orderedScores[1][0] === 'HOME'
          ? 'home_win'
          : orderedScores[1][0] === 'AWAY'
            ? 'away_win'
            : 'draw')
      : null;

    // 7. Save prediction
    const { data: prediction, error: predError } = await supabase
      .from('predictions')
      .insert({
        prediction_id: predictionId, // Add tracking ID
        match_id: matchId,
        predicted_outcome: predictedOutcome,
        confidence_score: confidencePercent,
        css_score: confidencePercent, // CSS Score for calibration
        model_version: modelVersion, // Track model version for performance analysis
        prediction_status: predictionStatus,
        blocked_reason: blockedReason,
        alternate_outcome: alternateOutcome,
        overconfidence_flag: false,
        prediction_factors: {
          patterns: detectedPatterns.map(p => p.template_name),
          pattern_count: detectedPatterns.length,
          form_scores: {
            home: homeFormScore,
            away: awayFormScore
          },
          h2h: {
            matches_analyzed: h2hMatches.length,
            home_wins: h2hMatches.filter(m => {
              const isHomeTeam = m.home_team_id === match.home_team.id;
              const teamScore = isHomeTeam ? m.home_score : m.away_score;
              const oppScore = isHomeTeam ? m.away_score : m.home_score;
              return teamScore > oppScore;
            }).length,
            away_wins: h2hMatches.filter(m => {
              const isAwayTeamHome = m.home_team_id === match.away_team.id;
              const teamScore = isAwayTeamHome ? m.home_score : m.away_score;
              const oppScore = isAwayTeamHome ? m.away_score : m.home_score;
              return teamScore > oppScore;
            }).length
          },
          league_context: {
            avg_goals_per_match: match.league.avg_goals_per_match,
            league_name: match.league.name
          }
        },
        ensemble_breakdown: ensembleResult,
        calibration_error: null,
        btts_prediction: match.league.avg_goals_per_match > 2.5
      })
      .select()
      .single();

    if (predError) {
      console.error('Error saving prediction:', predError);
      return new Response(
        JSON.stringify({ error: 'Failed to save prediction', details: predError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 8. Log prediction event to evaluation log
    try {
      await logPredictionEvent(
        predictionId,
        match.home_team.name,
        match.away_team.name,
        confidencePercent / 100, // Convert to 0-1 range
        predictedOutcome,
        null, // actual_result is null at prediction time
        modelVersion
      );
    } catch (logError) {
      console.error('Error logging prediction event:', logError);
      // Don't fail the request, just log the error
    }

    // 9. Save detected patterns
    for (const pattern of detectedPatterns) {
      const { data: template } = await supabase
        .from('pattern_templates')
        .select('id')
        .eq('name', pattern.template_name)
        .single();

      if (template) {
        await supabase.from('detected_patterns').insert({
          match_id: matchId,
          template_id: template.id,
          confidence_contribution: pattern.confidence_boost,
          pattern_data: pattern.data
        });
      }
    }

    // Log the action for audit
    await logAuditAction(
      context.supabaseClient,
      context.user.id,
      'analyze_match',
      'match',
      matchId,
      {
        predicted_outcome: predictedOutcome,
        confidence_score: confidencePercent,
        patterns_detected: detectedPatterns.length,
        ensemble_result: ensembleResult
      },
      context.user.email
    );

    console.log(`✅ Prediction created for match ${matchId}: ${predictedOutcome} (${confidencePercent}%) by ${context.user.email}`);

    return new Response(
      JSON.stringify({ 
        prediction: {
          ...prediction,
          prediction_id: predictionId // Include tracking ID in response
        }, 
        patterns: detectedPatterns,
        form_scores: { home: homeFormScore, away: awayFormScore },
        prediction_id: predictionId // Also include at top level for easy access
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-match:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
