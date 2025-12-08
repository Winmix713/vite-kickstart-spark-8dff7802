import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { validateRequest, ModelPruneSchema, corsHeaders } from "../_shared/validation.ts";
import { 
  protectEndpoint, 
  requireAdmin, 
  createAuthErrorResponse, 
  logAuditAction,
  handleCorsPreflight 
} from "../_shared/auth.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight();
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate and authorize the request (admin only)
    const authResult = await protectEndpoint(
      req.headers.get('Authorization'),
      requireAdmin
    );

    if ('error' in authResult) {
      return createAuthErrorResponse(authResult.error);
    }

    const { context } = authResult;
    const { serviceClient: supabase } = context;

    const body = await req.json();
    const validation = validateRequest(ModelPruneSchema, body);
    
    if (!validation.success) {
      return new Response(
        JSON.stringify({ error: validation.error, details: validation.details }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { threshold, min_sample_size } = validation.data;

    const { data: accRows, error } = await supabase
      .from("pattern_accuracy")
      .select("template_id, total_predictions, accuracy_rate, id")
      .gte("total_predictions", min_sample_size)
      .lt("accuracy_rate", threshold);

    if (error) {
      throw error;
    }

    type AccRow = { template_id: string | null; total_predictions: number | null; accuracy_rate: number | null; id: string };
    const toDeactivate: AccRow[] = (accRows as AccRow[]) ?? [];
    const templateIds = toDeactivate.map((r) => r.template_id).filter((v): v is string => Boolean(v));

    let updated = 0;
    let details: { id: string; name: string; is_active: boolean }[] = [];
    if (templateIds.length > 0) {
      const { data: updatedTemplates, error: updateError } = await supabase
        .from("pattern_templates")
        .update({ is_active: false })
        .in("id", templateIds)
        .select("id, name, is_active");

      if (updateError) {
        console.error("models-auto-prune update error", updateError);
      } else {
        updated = updatedTemplates?.length ?? 0;
        details = (updatedTemplates as { id: string; name: string; is_active: boolean }[]) ?? [];
      }
    }

    // Log the action for audit
    await logAuditAction(
      context.supabaseClient,
      context.user.id,
      'prune_models',
      'pattern_templates',
      'batch',
      {
        threshold,
        min_sample_size,
        candidates: toDeactivate.length,
        deactivated: updated,
        template_ids: templateIds
      },
      context.user.email
    );

    return new Response(
      JSON.stringify({
        threshold,
        min_sample_size,
        candidates: toDeactivate.length,
        deactivated: updated,
        templates: details,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("models-auto-prune error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
