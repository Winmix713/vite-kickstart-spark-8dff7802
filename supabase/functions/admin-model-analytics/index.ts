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
    // Parse request body for window_days parameter
    let windowDays = 7; // default
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      if (body.window_days && typeof body.window_days === "number" && body.window_days > 0) {
        windowDays = body.window_days;
      }
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user is authenticated
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

    if (!profile || (profile.role !== "admin" && profile.role !== "analyst")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get predictions with results for accuracy tracking
    const { data: predictions } = await supabaseClient
      .from("predictions")
      .select("id, confidence_score, predicted_outcome, actual_outcome, created_at")
      .not("actual_outcome", "is", null)
      .gte("created_at", `now() - interval '${windowDays} days'`)
      .order("created_at", { ascending: false });

    // Calculate metrics
    const total = predictions?.length || 0;
    const correct =
      predictions?.filter((p) => p.predicted_outcome === p.actual_outcome).length ||
      0;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    // Calculate fail rate
    const failRate = total > 0 ? ((total - correct) / total) * 100 : 0;

    // Group by date for time series
    const dailyStats = new Map<string, { total: number; correct: number; avgConfidence: number }>();
    
    predictions?.forEach((p) => {
      const date = new Date(p.created_at).toISOString().split("T")[0];
      const stats = dailyStats.get(date) || { total: 0, correct: 0, avgConfidence: 0 };
      stats.total += 1;
      if (p.predicted_outcome === p.actual_outcome) {
        stats.correct += 1;
      }
      stats.avgConfidence += p.confidence_score || 0;
      dailyStats.set(date, stats);
    });

    // Convert to array for charting
    const timeSeriesData = Array.from(dailyStats.entries()).map(([date, stats]) => ({
      date,
      accuracy: (stats.correct / stats.total) * 100,
      confidence: stats.avgConfidence / stats.total,
      predictions: stats.total,
    })).sort((a, b) => a.date.localeCompare(b.date));

    // Confidence trend
    const confidenceTrend = predictions?.map((p) => ({
      timestamp: p.created_at,
      confidence: p.confidence_score || 0,
      isCorrect: p.predicted_outcome === p.actual_outcome,
    })) || [];

    const response = {
      summary: {
        totalPredictions: total,
        correctPredictions: correct,
        accuracy: parseFloat(accuracy.toFixed(2)),
        failRate: parseFloat(failRate.toFixed(2)),
        avgConfidence: predictions?.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / total || 0,
      },
      timeSeriesData,
      confidenceTrend,
      windowDays,
      systemStatus: failRate > 30 ? "degraded" : failRate > 15 ? "warning" : "healthy",
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
