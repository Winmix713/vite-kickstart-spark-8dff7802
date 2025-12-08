import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { validateRequest, PredictionInputSchema, corsHeaders } from "../_shared/validation.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();
    const validation = validateRequest(PredictionInputSchema, body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error, details: validation.details }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      matchId,
      predictedOutcome,
      confidenceScore,
      cssScore,
      predictionFactors,
      bttsPrediction,
      overUnderPrediction,
      predictedHomeScore,
      predictedAwayScore,
    } = validation.data;

    const insert = {
      match_id: matchId,
      predicted_outcome: predictedOutcome,
      confidence_score: confidenceScore,
      css_score: cssScore ?? confidenceScore,
      prediction_factors: predictionFactors,
      btts_prediction: bttsPrediction,
      over_under_prediction: overUnderPrediction,
      predicted_home_score: predictedHomeScore,
      predicted_away_score: predictedAwayScore,
    };

    const { data, error } = await supabase
      .from("predictions")
      .insert(insert)
      .select()
      .single();

    if (error) {
      console.error("predictions-track insert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ prediction: data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("predictions-track unexpected error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
