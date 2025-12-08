import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  corsHeaders,
  handleCorsPreflight,
  protectEndpoint,
  requireAdmin,
  logAuditAction,
} from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight();
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const authResult = await protectEndpoint(req.headers.get("Authorization"), requireAdmin);
  if ("error" in authResult) {
    return new Response(JSON.stringify({ error: authResult.error.message }), {
      status: authResult.error.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { context } = authResult;
  const supabase = context.serviceClient;

  let payload: { modelId?: string; reason?: string } = {};
  try {
    payload = await req.json();
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { modelId, reason } = payload;
  if (!modelId) {
    return new Response(JSON.stringify({ error: "Model ID required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { data: targetModel, error: fetchError } = await supabase
      .from("model_registry")
      .select("*")
      .eq("id", modelId)
      .single();

    if (fetchError || !targetModel) {
      return new Response(JSON.stringify({ error: "Model not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: demoteError } = await supabase
      .from("model_registry")
      .update({
        model_type: "retired",
        traffic_allocation: 0,
        is_active: false,
      })
      .eq("model_type", "champion");

    if (demoteError) {
      throw demoteError;
    }

    const { data: updatedModel, error: promoteError } = await supabase
      .from("model_registry")
      .update({
        model_type: "champion",
        traffic_allocation: 90,
        is_active: true,
      })
      .eq("id", modelId)
      .select("*")
      .single();

    if (promoteError || !updatedModel) {
      throw promoteError || new Error("Failed to promote model");
    }

    const { error: overrideError } = await supabase.from("model_override_log").insert({
      model_id: modelId,
      previous_state: targetModel,
      new_state: updatedModel,
      reason: reason || "Manual promotion via admin dashboard",
      triggered_by: context.user.id,
    });

    if (overrideError) {
      throw overrideError;
    }

    await logAuditAction(
      context.supabaseClient,
      context.user.id,
      "promote_model",
      "model_registry",
      modelId,
      {
        previous_state: targetModel,
        new_state: updatedModel,
        reason: reason || "Manual promotion via admin dashboard",
      },
      context.user.email
    );

    const promotedName =
      updatedModel.model_name || targetModel.model_name || updatedModel.model_version || modelId;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Model ${promotedName} promoted to champion`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("admin-model-promote error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
