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

    if (!profile || (profile.role !== "admin" && profile.role !== "analyst")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get model registry data
    const { data: models, error: modelsError } = await supabaseClient
      .from("model_registry")
      .select("*")
      .order("registered_at", { ascending: false });

    if (modelsError) throw modelsError;

    // Get active model (champion)
    const { data: activeModel } = await supabaseClient
      .from("model_registry")
      .select("*")
      .eq("model_type", "champion")
      .eq("is_active", true)
      .single();

    // Get model experiments
    const { data: experiments } = await supabaseClient
      .from("model_experiments")
      .select("*")
      .order("started_at", { ascending: false })
      .limit(10);

    // Get recent predictions for analytics
    const { data: recentPredictions } = await supabaseClient
      .from("predictions")
      .select("id, confidence, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    const response = {
      models: models || [],
      activeModel: activeModel || null,
      experiments: experiments || [],
      recentPredictions: recentPredictions || [],
      config: {
        active_model_id: activeModel?.id || null,
        prediction_target: "fulltime",
        min_confidence_threshold: 0.6,
      },
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
