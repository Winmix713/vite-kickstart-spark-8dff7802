import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  protectEndpoint,
  requireAdmin,
  createAuthErrorResponse,
  logAuditAction,
  handleCorsPreflight,
  corsHeaders,
} from "../_shared/auth.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const ReviewActionSchema = z.object({
  predictionId: z.string().uuid("Invalid UUID format"),
  action: z.enum(["accepted", "rejected"], {
    errorMap: () => ({ message: "action must be 'accepted' or 'rejected'" }),
  }),
  notes: z.string().optional(),
});

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return handleCorsPreflight();
  }

  try {
    // Authenticate and authorize the request
    const authResult = await protectEndpoint(
      req.headers.get("Authorization"),
      requireAdmin
    );

    if ("error" in authResult) {
      return createAuthErrorResponse(authResult.error);
    }

    const { context } = authResult;
    const { serviceClient: supabase } = context;

    // Handle GET request - fetch blocked predictions
    if (req.method === "GET") {
      const url = new URL(req.url);
      const limit = Math.min(parseInt(url.searchParams.get("limit") || "50"), 100);
      const offset = parseInt(url.searchParams.get("offset") || "0");

      // Fetch blocked predictions with match and team details
      const { data: predictions, error: predictionsError, count } = await supabase
        .from("blocked_predictions_for_review")
        .select(
          `
          id,
          match_id,
          predicted_outcome,
          confidence_score,
          downgraded_from_confidence,
          prediction_status,
          overconfidence_flag,
          blocked_reason,
          alternate_outcome,
          blocked_at,
          reviewer_email,
          home_team_name,
          away_team_name
          `,
          { count: "exact" }
        )
        .order("blocked_at", { ascending: false })
        .range(offset, offset + limit - 1);

      if (predictionsError) {
        console.error("Error fetching blocked predictions:", predictionsError);
        return new Response(
          JSON.stringify({
            error: "Failed to fetch blocked predictions",
            details: predictionsError,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      return new Response(
        JSON.stringify({
          success: true,
          data: predictions || [],
          pagination: {
            offset,
            limit,
            total: count || 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle POST request - process review action
    if (req.method === "POST") {
      const body = await req.json();

      // Validate input
      const validation = ReviewActionSchema.safeParse(body);
      if (!validation.success) {
        return new Response(
          JSON.stringify({
            error: "Invalid request",
            details: validation.error.issues,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const { predictionId, action, notes } = validation.data;

      // Fetch the prediction
      const { data: prediction, error: predError } = await supabase
        .from("predictions")
        .select("*")
        .eq("id", predictionId)
        .single();

      if (predError || !prediction) {
        console.error("Error fetching prediction:", predError);
        return new Response(
          JSON.stringify({ error: "Prediction not found" }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Check if prediction is actually blocked
      if (!prediction.overconfidence_flag) {
        return new Response(
          JSON.stringify({
            error: "Prediction is not blocked or overconfident",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const previousStatus = prediction.prediction_status;
      let newStatus: string;
      let clearBlockFields = false;

      // Determine new status based on action
      if (action === "accepted") {
        // Accept: keep as blocked
        newStatus = "blocked";
      } else {
        // Reject: restore to active and clear block fields
        newStatus = "active";
        clearBlockFields = true;
      }

      // Update the prediction
      const updatePayload: Record<string, string | boolean | null> = {
        prediction_status: newStatus,
        reviewed_by: context.user.id,
      };

      if (clearBlockFields) {
        updatePayload.overconfidence_flag = false;
        updatePayload.blocked_reason = null;
        updatePayload.alternate_outcome = null;
        updatePayload.downgraded_from_confidence = null;
        updatePayload.blocked_at = null;
      }

      const { error: updateError } = await supabase
        .from("predictions")
        .update(updatePayload)
        .eq("id", predictionId);

      if (updateError) {
        console.error("Error updating prediction:", updateError);
        return new Response(
          JSON.stringify({
            error: "Failed to update prediction",
            details: updateError,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Insert review log entry
      const { error: logError } = await supabase
        .from("prediction_review_log")
        .insert({
          prediction_id: predictionId,
          action,
          reviewer_id: context.user.id,
          notes: notes || null,
          previous_status: previousStatus,
        });

      if (logError) {
        console.error("Error inserting review log:", logError);
        return new Response(
          JSON.stringify({
            error: "Failed to log review action",
            details: logError,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Log audit action
      await logAuditAction(
        context.supabaseClient,
        context.user.id,
        "prediction_review",
        "prediction",
        predictionId,
        {
          action,
          previousStatus,
          newStatus,
          notes,
        },
        context.user.email
      );

      console.log(
        `✅ Prediction ${predictionId} review: ${action} by ${context.user.email}`
      );

      return new Response(
        JSON.stringify({
          success: true,
          message: `Prediction ${action} successfully`,
          data: {
            predictionId,
            action,
            newStatus,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Method not allowed
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in admin-prediction-review:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
