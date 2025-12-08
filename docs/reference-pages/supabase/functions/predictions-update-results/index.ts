import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
    const { matchId, actualOutcome, homeScore, awayScore, halfTimeHomeScore, halfTimeAwayScore } = body ?? {};

    if (!matchId) {
      return new Response(JSON.stringify({ error: "matchId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalOutcome: string | null = null;

    if (typeof homeScore === "number" && typeof awayScore === "number") {
      if (halfTimeHomeScore != null && halfTimeHomeScore > homeScore) {
        return new Response(JSON.stringify({ error: "Halftime home score cannot be greater than final" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (halfTimeAwayScore != null && halfTimeAwayScore > awayScore) {
        return new Response(JSON.stringify({ error: "Halftime away score cannot be greater than final" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { error: matchUpdateError } = await supabase
        .from("matches")
        .update({
          home_score: homeScore,
          away_score: awayScore,
          halftime_home_score: halfTimeHomeScore ?? null,
          halftime_away_score: halfTimeAwayScore ?? null,
          status: "finished",
        })
        .eq("id", matchId);

      if (matchUpdateError) {
        console.error("update-results match update error", matchUpdateError);
        return new Response(JSON.stringify({ error: "Failed to update match" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      finalOutcome = homeScore > awayScore ? "home_win" : homeScore < awayScore ? "away_win" : "draw";
    }

    const computedOutcome = actualOutcome ?? finalOutcome;

    if (!computedOutcome) {
      return new Response(JSON.stringify({ error: "Provide actualOutcome or final scores" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: prediction, error: predError } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", matchId)
      .single();

    if (predError || !prediction) {
      return new Response(JSON.stringify({ error: "Prediction not found for match" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const wasCorrect = prediction.predicted_outcome === computedOutcome;
    const pScore = (prediction.css_score ?? prediction.confidence_score) / 100;
    const calibrationError = Math.abs(pScore - (wasCorrect ? 1 : 0));

    const { error: updatePredictionError } = await supabase
      .from("predictions")
      .update({
        actual_outcome: computedOutcome,
        was_correct: wasCorrect,
        calibration_error: Math.round(calibrationError * 10000) / 10000,
        evaluated_at: new Date().toISOString(),
      })
      .eq("id", prediction.id);

    if (updatePredictionError) {
      console.error("update-results prediction update error", updatePredictionError);
      return new Response(JSON.stringify({ error: "Failed to update prediction" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update pattern_accuracy similar to submit-feedback
    const { data: patterns } = await supabase
      .from("detected_patterns")
      .select("template_id")
      .eq("match_id", matchId);

    if (patterns && patterns.length > 0) {
      for (const pattern of patterns) {
        const { data: accuracy } = await supabase
          .from("pattern_accuracy")
          .select("*")
          .eq("template_id", pattern.template_id)
          .maybeSingle();

        if (!accuracy) continue;

        const newTotal = (accuracy.total_predictions ?? 0) + 1;
        const newCorrect = (accuracy.correct_predictions ?? 0) + (wasCorrect ? 1 : 0);
        const newRate = newTotal > 0 ? (newCorrect / newTotal) * 100 : 0;

        await supabase
          .from("pattern_accuracy")
          .update({
            total_predictions: newTotal,
            correct_predictions: newCorrect,
            accuracy_rate: Math.round(newRate * 100) / 100,
            last_updated: new Date().toISOString(),
          })
          .eq("id", accuracy.id);
      }
    }

    return new Response(
      JSON.stringify({ success: true, wasCorrect, actualOutcome: computedOutcome }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("predictions-update-results unexpected error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
