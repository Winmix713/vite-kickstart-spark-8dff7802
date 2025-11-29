import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const status = url.searchParams.get('status');
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const useValueRanking = url.searchParams.get('value_ranking') === 'true';
    const matchIdsParam = url.searchParams.get('match_ids'); // Comma-separated UUIDs

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // If value ranking is requested with match IDs, use the RPC function
    if (useValueRanking && matchIdsParam) {
      const matchIds = matchIdsParam.split(',').filter(id => id.trim().length > 0);
      
      if (matchIds.length === 0) {
        return new Response(
          JSON.stringify({ error: 'No valid match IDs provided' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: valueRankedMatches, error: rpcError } = await supabase
        .rpc('get_value_ranked_matches', { p_match_ids: matchIds });

      if (rpcError) {
        console.error('Error calling get_value_ranked_matches RPC:', rpcError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch value-ranked matches', details: rpcError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Fetch full prediction data for these matches and combine with value ranking
      const { data: predictions, error: predictionsError } = await supabase
        .from('predictions')
        .select(`
          *,
          match:matches(
            *,
            home_team:teams!home_team_id(id, name),
            away_team:teams!away_team_id(id, name),
            league:leagues(id, name)
          )
        `)
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

      if (predictionsError) {
        console.error('Error fetching predictions:', predictionsError);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch predictions', details: predictionsError }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Combine value ranking data with predictions
      const enrichedPredictions = predictions?.map(pred => ({
        ...pred,
        value_ranking: valueRankedMatches?.find(m => m.id === pred.match_id) || {
          value_score: 0,
          is_featured: false,
          home_xg: 0,
          away_xg: 0,
          btts_probability: 0,
        }
      })) || [];

      return new Response(
        JSON.stringify({ predictions: enrichedPredictions, value_ranked: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Build regular query
    const query = supabase
      .from('predictions')
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!home_team_id(id, name),
          away_team:teams!away_team_id(id, name),
          league:leagues(id, name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by match status if provided
    if (status) {
      const { data: allPredictions, error } = await query;
      
      if (error) {
        console.error('Error fetching predictions:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to fetch predictions', details: error }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const filteredPredictions = allPredictions?.filter(p => p.match.status === status) || [];

      return new Response(
        JSON.stringify({ predictions: filteredPredictions }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No filter, return all
    const { data: predictions, error } = await query;

    if (error) {
      console.error('Error fetching predictions:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch predictions', details: error }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ predictions: predictions || [] }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in get-predictions:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
