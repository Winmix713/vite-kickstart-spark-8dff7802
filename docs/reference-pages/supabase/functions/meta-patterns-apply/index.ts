import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const patternId = body?.pattern_id as string | undefined;
    const matchId = body?.match_id as string | undefined;

    if (!patternId || !matchId) {
      return new Response(JSON.stringify({ error: "pattern_id and match_id are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pattern, error: pErr } = await supabase
      .from("meta_patterns")
      .select("id, prediction_impact, pattern_name")
      .eq("id", patternId)
      .maybeSingle();

    if (pErr || !pattern) {
      return new Response(JSON.stringify({ error: "Meta-pattern not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: pred, error: predErr } = await supabase
      .from("predictions")
      .select("id, confidence_score, predicted_outcome")
      .eq("match_id", matchId)
      .maybeSingle();

    if (predErr || !pred) {
      return new Response(JSON.stringify({ error: "Prediction not found for match" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const previous = pred.confidence_score ?? 0;
    const impact = typeof pattern.prediction_impact === "number" ? pattern.prediction_impact : 0;
    const adjusted = Math.min(95, Number(previous) + Number(impact));

    const { error: updateErr } = await supabase
      .from("predictions")
      .update({ confidence_score: adjusted })
      .eq("id", pred.id);

    if (updateErr) {
      throw updateErr;
    }

    const message = `Meta-pattern alkalmazva: ${pattern.pattern_name} (+${impact.toFixed(1)}%)`;

    return new Response(
      JSON.stringify({ match_id: matchId, previous_confidence: previous, adjusted_confidence: adjusted, message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error in meta-patterns-apply:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
