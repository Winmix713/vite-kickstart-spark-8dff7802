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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify user is admin
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
      return new Response(JSON.stringify({ error: "Forbidden - Admin only" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { modelName, algorithm = "random_forest" } = body;

    // Create a new challenger model entry
    const newModelName = modelName || `Model_${new Date().toISOString().split("T")[0]}`;
    const newVersion = `v${Date.now()}`;

    const { data: newModel, error: insertError } = await supabaseClient
      .from("model_registry")
      .insert({
        model_name: newModelName,
        model_version: newVersion,
        model_type: "challenger",
        algorithm: algorithm,
        hyperparameters: {
          n_estimators: 100,
          max_depth: 10,
          min_samples_split: 2,
        },
        traffic_allocation: 10,
        is_active: false,
        total_predictions: 0,
        accuracy: 0,
        description: "Training initiated via admin dashboard",
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Simulate training job
    const jobId = `train_${Date.now()}`;

    // Return immediate response (non-blocking)
    return new Response(
      JSON.stringify({
        success: true,
        message: "Training job started",
        jobId,
        modelId: newModel.id,
        estimatedTime: "5-10 minutes",
        status: "queued",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
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
