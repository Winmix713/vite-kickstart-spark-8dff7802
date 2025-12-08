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
    const status = url.searchParams.get('status'); // 'scheduled' vagy 'finished'
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build query
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
      // We need to filter by match.status, but Supabase doesn't support nested filtering directly
      // So we'll fetch all and filter in code (or use a view in production)
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
