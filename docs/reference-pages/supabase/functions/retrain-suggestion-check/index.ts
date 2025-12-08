import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Only allow service role or admin users
    const authHeader = req.headers.get("Authorization");
    const isServiceRole = authHeader?.startsWith("Bearer ") && 
      authHeader.split(" ")[1].startsWith("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.");

    // For service role (cron job), create client with service role key
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // If not service role, verify admin user
    if (!isServiceRole) {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user profile to check role
      const { data: profile } = await supabaseClient
        .from("user_profiles")
        .select("role")
        .eq("user_id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Check if there's already a pending suggestion
    const { data: existingSuggestion } = await supabaseClient
      .from("retrain_suggestion_log")
      .select("id")
      .eq("status", "pending")
      .single();

    if (existingSuggestion) {
      return new Response(
        JSON.stringify({ 
          message: "Pending suggestion already exists",
          suggestionId: existingSuggestion.id 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate 7-day accuracy from predictions
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: predictions, error: predictionsError } = await supabaseClient
      .from("predictions")
      .select("predicted_outcome, actual_outcome")
      .not("actual_outcome", "is", null)
      .gte("created_at", sevenDaysAgo.toISOString());

    if (predictionsError) {
      throw new Error(`Failed to fetch predictions: ${predictionsError.message}`);
    }

    const totalPredictions = predictions?.length || 0;
    
    // Need at least 10 predictions to make a meaningful suggestion
    if (totalPredictions < 10) {
      return new Response(
        JSON.stringify({ 
          message: "Insufficient data for suggestion",
          totalPredictions,
          minimumRequired: 10
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const correctPredictions = predictions?.filter(
      (p) => p.predicted_outcome === p.actual_outcome
    ).length || 0;

    const accuracy = totalPredictions > 0 ? (correctPredictions / totalPredictions) * 100 : 0;

    // Only create suggestion if accuracy is below 70%
    if (accuracy >= 70) {
      return new Response(
        JSON.stringify({ 
          message: "Accuracy is acceptable",
          accuracy: parseFloat(accuracy.toFixed(2)),
          threshold: 70
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create retrain suggestion
    const { data: suggestion, error: suggestionError } = await supabaseClient
      .from("retrain_suggestion_log")
      .insert({
        window_days: 7,
        accuracy: parseFloat(accuracy.toFixed(2)),
        status: "pending",
        notes: `Accuracy dropped to ${accuracy.toFixed(2)}% below 70% threshold. Based on ${totalPredictions} predictions from the last 7 days.`,
      })
      .select()
      .single();

    if (suggestionError) {
      throw new Error(`Failed to create suggestion: ${suggestionError.message}`);
    }

    // Log to system_logs for traceability
    try {
      const { error: logError } = await supabaseClient
        .from("system_logs")
        .insert({
          level: "warning",
          message: `Retrain suggestion created: Accuracy ${accuracy.toFixed(2)}% below 70% threshold`,
          context: {
            suggestion_id: suggestion.id,
            accuracy: parseFloat(accuracy.toFixed(2)),
            total_predictions: totalPredictions,
            window_days: 7,
            threshold: 70,
          },
          source: "retrain-suggestion-check",
        });

      if (logError) {
        console.error("Failed to log to system_logs:", logError);
      }
    } catch (logErr) {
      console.error("Error logging to system_logs:", logErr);
    }

    return new Response(
      JSON.stringify({
        message: "Retrain suggestion created",
        suggestion,
        accuracy: parseFloat(accuracy.toFixed(2)),
        totalPredictions,
        threshold: 70,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in retrain-suggestion-check:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message || "Internal server error",
        details: error.stack 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});