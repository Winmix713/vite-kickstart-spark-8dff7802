import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest, corsHeaders } from "../_shared/validation.ts";
import { 
  protectEndpoint, 
  requireAdminOrAnalyst, 
  createAuthErrorResponse,
  handleCorsPreflight 
} from "../_shared/auth.ts";
import { logPredictionEvent } from "../_shared/evaluation-logging.ts";

// Schema for result reconciliation request
const ResultReconciliationSchema = {
  type: "object",
  properties: {
    prediction_id: { type: "string", minLength: 1 },
    actual_result: { type: "string", enum: ["home_win", "away_win", "draw"] }
  },
  required: ["prediction_id", "actual_result"]
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreflight();
  }

  try {
    // Authenticate and authorize the request
    const authResult = await protectEndpoint(
      req.headers.get('Authorization'),
      requireAdminOrAnalyst
    );

    if ('error' in authResult) {
      return createAuthErrorResponse(authResult.error);
    }

    const { context } = authResult;
    const { serviceClient: supabase } = context;

    // Validate input
    const body = await req.json();
    const validation = validateRequest(ResultReconciliationSchema, body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error, details: validation.details }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { prediction_id, actual_result } = validation.data;

    // 1. Fetch the original prediction to get details
    const { data: prediction, error: predictionError } = await supabase
      .from('predictions')
      .select(`
        *,
        match:matches(
          home_team:teams(name),
          away_team:teams(name)
        )
      `)
      .eq('prediction_id', prediction_id)
      .single();

    if (predictionError || !prediction) {
      return new Response(
        JSON.stringify({ error: 'Prediction not found', details: prediction_id }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 2. Update the prediction with actual result
    const was_correct = prediction.predicted_outcome === actual_result;
    
    const { data: updatedPrediction, error: updateError } = await supabase
      .from('predictions')
      .update({
        actual_outcome: actual_result,
        was_correct: was_correct,
        updated_at: new Date().toISOString()
      })
      .eq('prediction_id', prediction_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating prediction:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to update prediction', details: updateError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 3. Log the result reconciliation to evaluation log
    try {
      await logPredictionEvent(
        prediction_id,
        prediction.match?.home_team?.name || 'Unknown Home Team',
        prediction.match?.away_team?.name || 'Unknown Away Team',
        prediction.confidence_score / 100, // Convert to 0-1 range
        prediction.predicted_outcome,
        actual_result,
        prediction.model_version || 'v1.0'
      );
    } catch (logError) {
      console.error('Error logging result reconciliation:', logError);
      // Don't fail the request, just log the error
    }

    // 4. Log audit action
    await supabase
      .from('audit_logs')
      .insert({
        user_id: context.user.id,
        action: 'reconcile_prediction_result',
        resource_type: 'prediction',
        resource_id: prediction_id,
        details: {
          predicted_outcome: prediction.predicted_outcome,
          actual_result: actual_result,
          was_correct: was_correct,
          confidence_score: prediction.confidence_score
        },
        ip_address: req.headers.get('x-forwarded-for') || 'unknown',
        user_agent: req.headers.get('user-agent') || 'unknown'
      });

    console.log(`✅ Result reconciled for prediction ${prediction_id}: ${actual_result} (correct: ${was_correct}) by ${context.user.email}`);

    return new Response(
      JSON.stringify({
        success: true,
        prediction_id: prediction_id,
        predicted_outcome: prediction.predicted_outcome,
        actual_result: actual_result,
        was_correct: was_correct,
        confidence_score: prediction.confidence_score,
        message: was_correct ? '✅ Prediction was correct!' : '❌ Prediction was incorrect'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in reconcile-prediction-result:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});