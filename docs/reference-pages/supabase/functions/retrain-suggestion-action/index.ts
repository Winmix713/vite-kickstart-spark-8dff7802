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

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const { suggestionId, action, notes } = await req.json();

    if (!suggestionId || !action || !["accept", "dismiss"].includes(action)) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid request. Required: suggestionId, action (accept/dismiss)" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

    // Verify user is authenticated and is admin
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

    // Get the suggestion details
    const { data: suggestion, error: suggestionError } = await supabaseClient
      .from("retrain_suggestion_log")
      .select("*")
      .eq("id", suggestionId)
      .eq("status", "pending")
      .single();

    if (suggestionError || !suggestion) {
      return new Response(
        JSON.stringify({ error: "Suggestion not found or not pending" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const retrainingRunId = null;

    // If accepting, create retraining request
    if (action === "accept") {
      const { data: retrainingRequest, error: requestError } = await supabaseClient
        .from("model_retraining_requests")
        .insert({
          requested_by: user.id,
          reason: notes || `Accepted suggestion: Accuracy ${suggestion.accuracy}% below 70% threshold`,
          priority: "high",
          status: "pending",
        })
        .select()
        .single();

      if (requestError) {
        throw new Error(`Failed to create retraining request: ${requestError.message}`);
      }

      // Trigger the training workflow
      const { error: triggerError } = await supabaseClient.functions.invoke(
        "admin-model-trigger-training",
        {
          body: {
            requestId: retrainingRequest.id,
            reason: notes || `Auto-suggested retraining: Accuracy ${suggestion.accuracy}%`,
          },
        }
      );

      if (triggerError) {
        console.error("Failed to trigger training:", triggerError);
        // Don't fail the whole operation, just log it
      }
    }

    // Update the suggestion status
    const updateData: {
      status: "accepted" | "dismissed";
      acknowledged_at: string;
      notes?: string;
      retraining_run_id?: string | null;
    } = {
      status: action === "accept" ? "accepted" : "dismissed",
      acknowledged_at: new Date().toISOString(),
      notes: notes || suggestion.notes,
    };

    if (retrainingRunId) {
      updateData.retraining_run_id = retrainingRunId;
    }

    const { data: updatedSuggestion, error: updateError } = await supabaseClient
      .from("retrain_suggestion_log")
      .update(updateData)
      .eq("id", suggestionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(`Failed to update suggestion: ${updateError.message}`);
    }

    // Log to admin_audit_log
    const { error: auditError } = await supabaseClient
      .from("admin_audit_log")
      .insert({
        user_id: user.id,
        action: `retrain_suggestion_${action}`,
        details: {
          suggestion_id: suggestionId,
          accuracy: suggestion.accuracy,
          window_days: suggestion.window_days,
          notes: notes,
        },
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown",
      });

    if (auditError) {
      console.error("Failed to log to admin_audit_log:", auditError);
    }

    return new Response(
      JSON.stringify({
        message: `Suggestion ${action}ed successfully`,
        suggestion: updatedSuggestion,
        retrainingRequestCreated: action === "accept",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error) {
    console.error("Error in retrain-suggestion-action:", error);
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