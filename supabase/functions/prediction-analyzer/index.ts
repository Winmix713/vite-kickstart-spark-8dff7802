import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PredictionRecord {
  id: string;
  accuracy_score: number;
  confidence_score: number;
  status: string;
  created_at: string;
  match: {
    id: string;
    league: {
      name: string;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const metric = url.searchParams.get('metric'); // 'accuracy_trends', 'league_breakdown', 'confidence_calibration'
    const startDate = url.searchParams.get('start_date');
    const endDate = url.searchParams.get('end_date');
    const league = url.searchParams.get('league');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Default to last 30 days if not specified
    const end = new Date(endDate || new Date());
    const start = new Date(startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000));

    if (!metric) {
      // Return all metrics if no specific metric requested
      const [accuracyTrends, leagueBreakdown, confidenceCalibration] = await Promise.all([
        getAccuracyTrends(supabase, start, end, league),
        getLeagueBreakdown(supabase, start, end),
        getConfidenceCalibration(supabase, start, end),
      ]);

      return new Response(
        JSON.stringify({
          accuracy_trends: accuracyTrends,
          league_breakdown: leagueBreakdown,
          confidence_calibration: confidenceCalibration,
          period: { start: start.toISOString(), end: end.toISOString() }
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result;
    switch (metric) {
      case 'accuracy_trends':
        result = await getAccuracyTrends(supabase, start, end, league);
        break;
      case 'league_breakdown':
        result = await getLeagueBreakdown(supabase, start, end);
        break;
      case 'confidence_calibration':
        result = await getConfidenceCalibration(supabase, start, end);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid metric parameter' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ [metric]: result, period: { start: start.toISOString(), end: end.toISOString() } }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in prediction-analyzer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function getAccuracyTrends(supabase: SupabaseClient, startDate: Date, endDate: Date, league?: string | null) {
  try {
    const query = supabase
      .from('predictions')
      .select(`
        id,
        accuracy_score,
        confidence_score,
        status,
        created_at,
        match:matches(
          id,
          league:leagues(name)
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('status', ['won', 'lost', 'void']);

    if (league) {
      query.eq('match.league.name', league);
    }

    const { data: predictions, error } = await query;

    if (error) {
      console.error('Error fetching accuracy trends:', error);
      return { error: 'Failed to fetch accuracy trends', details: error };
    }

    // Group by week
    const weeklyData: { [key: string]: { total: number; accurate: number; avgConfidence: number } } = {};

    predictions?.forEach((pred: PredictionRecord) => {
      const date = new Date(pred.created_at);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const weekKey = weekStart.toISOString().split('T')[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { total: 0, accurate: 0, avgConfidence: 0 };
      }

      weeklyData[weekKey].total += 1;
      if (pred.accuracy_score >= 70) {
        weeklyData[weekKey].accurate += 1;
      }
      weeklyData[weekKey].avgConfidence += pred.confidence_score || 0;
    });

    const trendData = Object.entries(weeklyData)
      .sort(([keyA], [keyB]) => keyA.localeCompare(keyB))
      .map(([week, data]) => ({
        week,
        total_predictions: data.total,
        accurate_predictions: data.accurate,
        accuracy_percentage: data.total > 0 ? Math.round((data.accurate / data.total) * 100) : 0,
        avg_confidence: data.total > 0 ? Math.round((data.avgConfidence / data.total) * 100) / 100 : 0,
      }));

    return trendData;
  } catch (err) {
    console.error('Error in getAccuracyTrends:', err);
    return { error: 'Failed to calculate accuracy trends' };
  }
}

async function getLeagueBreakdown(supabase: SupabaseClient, startDate: Date, endDate: Date) {
  try {
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select(`
        id,
        accuracy_score,
        confidence_score,
        status,
        created_at,
        match:matches(
          id,
          league:leagues(name)
        )
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('status', ['won', 'lost', 'void']);

    if (error) {
      console.error('Error fetching league breakdown:', error);
      return { error: 'Failed to fetch league breakdown', details: error };
    }

    const leagueStats: { [key: string]: { total: number; accurate: number; avgConfidence: number; avgAccuracy: number } } = {};

    predictions?.forEach((pred: PredictionRecord) => {
      const leagueName = pred.match?.league?.name || 'Unknown';

      if (!leagueStats[leagueName]) {
        leagueStats[leagueName] = { total: 0, accurate: 0, avgConfidence: 0, avgAccuracy: 0 };
      }

      leagueStats[leagueName].total += 1;
      if (pred.accuracy_score >= 70) {
        leagueStats[leagueName].accurate += 1;
      }
      leagueStats[leagueName].avgConfidence += pred.confidence_score || 0;
      leagueStats[leagueName].avgAccuracy += pred.accuracy_score || 0;
    });

    const leagueData = Object.entries(leagueStats)
      .sort(([, a], [, b]) => b.total - a.total)
      .map(([league, data]) => ({
        league,
        total_predictions: data.total,
        accurate_predictions: data.accurate,
        accuracy_percentage: data.total > 0 ? Math.round((data.accurate / data.total) * 100) : 0,
        avg_confidence: data.total > 0 ? Math.round((data.avgConfidence / data.total) * 100) / 100 : 0,
        avg_accuracy_score: data.total > 0 ? Math.round((data.avgAccuracy / data.total) * 100) / 100 : 0,
      }));

    return leagueData;
  } catch (err) {
    console.error('Error in getLeagueBreakdown:', err);
    return { error: 'Failed to calculate league breakdown' };
  }
}

async function getConfidenceCalibration(supabase: SupabaseClient, startDate: Date, endDate: Date) {
  try {
    const { data: predictions, error } = await supabase
      .from('predictions')
      .select(`
        id,
        accuracy_score,
        confidence_score,
        status
      `)
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .in('status', ['won', 'lost', 'void']);

    if (error) {
      console.error('Error fetching confidence calibration:', error);
      return { error: 'Failed to fetch confidence calibration', details: error };
    }

    // Group by confidence ranges
    const confidenceBuckets: { [key: string]: { total: number; correct: number } } = {
      '0-20': { total: 0, correct: 0 },
      '20-40': { total: 0, correct: 0 },
      '40-60': { total: 0, correct: 0 },
      '60-80': { total: 0, correct: 0 },
      '80-100': { total: 0, correct: 0 },
    };

    predictions?.forEach((pred: PredictionRecord) => {
      const conf = pred.confidence_score || 0;
      let bucket: string;

      if (conf <= 20) bucket = '0-20';
      else if (conf <= 40) bucket = '20-40';
      else if (conf <= 60) bucket = '40-60';
      else if (conf <= 80) bucket = '60-80';
      else bucket = '80-100';

      confidenceBuckets[bucket].total += 1;
      if (pred.accuracy_score >= 70) {
        confidenceBuckets[bucket].correct += 1;
      }
    });

    const calibrationData = Object.entries(confidenceBuckets)
      .map(([bucket, data]) => ({
        confidence_range: bucket,
        total_predictions: data.total,
        correct_predictions: data.correct,
        calibration_score: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
        sample_size: data.total,
      }))
      .filter(d => d.total_predictions > 0);

    return calibrationData;
  } catch (err) {
    console.error('Error in getConfidenceCalibration:', err);
    return { error: 'Failed to calculate confidence calibration' };
  }
}
