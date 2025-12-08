import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runDetections, type DetectionResult, type DetectionFunctionKey, type GenericClient } from "../_shared/patterns.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";
import { corsHeaders } from "../_shared/validation.ts";
import { 
  protectEndpoint, 
  requireAdminOrAnalyst, 
  createAuthErrorResponse, 
  logAuditAction,
  handleCorsPreflight 
} from "../_shared/auth.ts";

// Extended validation schema for patterns-detect (has additional fields)
const PatternsDetectSchema = z.object({
  team_name: z.string().optional(),
  team_id: z.string().uuid().optional(),
  league_id: z.string().uuid().optional(),
  pattern_types: z.array(z.enum(["winning_streak", "home_dominance", "high_scoring_trend", "form_surge"])).optional(),
}).refine((data) => data.team_name || data.team_id, {
  message: "Either team_name or team_id must be provided",
});

interface RequestBody {
  team_name?: string;
  team_id?: string;
  league_id?: string;
  pattern_types?: DetectionFunctionKey[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return handleCorsPreflight();
  }

  // Check Phase 5 feature flag
  const phase5Enabled = Deno.env.get('PHASE5_ENABLED') === 'true';
  if (!phase5Enabled) {
    return new Response(
      JSON.stringify({ 
        error: 'Feature disabled',
        message: 'Phase 5 pattern detection is currently disabled'
      }),
      { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
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

    let params: RequestBody = {};
    if (req.method === "GET") {
      const url = new URL(req.url);
      params.team_name = url.searchParams.get("team_name") ?? undefined;
      params.team_id = url.searchParams.get("team_id") ?? undefined;
      const types = url.searchParams.get("pattern_types");
      if (types) params.pattern_types = types.split(",").map((t) => t.trim()) as DetectionFunctionKey[];
    } else {
      // Validate input
      const body = await req.json()
      const validation = PatternsDetectSchema.safeParse(body)
      if (!validation.success) {
        return new Response(
          JSON.stringify({ error: 'Invalid input', details: validation.error.issues }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      params = validation.data as RequestBody
    }

    let teamId = params.team_id ?? "";
    let teamName = params.team_name ?? "";

    if (!teamId) {
      const q = supabase.from("teams").select("id, name").eq("name", teamName).maybeSingle();
      const { data: team, error: teamError } = await q;
      if (teamError || !team) {
        return new Response(
          JSON.stringify({ error: "Team not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      teamId = team.id;
      teamName = team.name;
    }

    const detections: DetectionResult[] = await runDetections(supabase as GenericClient, teamId, params.pattern_types);

    // Upsert into team_patterns
    const upserted: Record<string, unknown>[] = [];
    for (const det of detections) {
      // fetch existing active pattern for this type
      const { data: existing, error: existingError } = await supabase
        .from("team_patterns")
        .select("id, historical_accuracy, valid_from")
        .eq("team_id", teamId)
        .eq("pattern_type", det.pattern_type)
        .is("valid_until", null)
        .maybeSingle();

      const payload = {
        team_id: teamId,
        pattern_type: det.pattern_type,
        pattern_name: det.pattern_name,
        confidence: det.confidence,
        strength: det.strength,
        prediction_impact: det.prediction_impact,
        pattern_metadata: det.metadata,
        historical_accuracy: existing?.historical_accuracy ?? 70,
        valid_from: existing?.valid_from ?? new Date().toISOString(),
      };

      if (existing) {
        const { data: updated, error } = await supabase
          .from("team_patterns")
          .update(payload)
          .eq("id", existing.id)
          .select()
          .single();
        if (!error && updated) upserted.push(updated);
      } else {
        const { data: inserted, error } = await supabase
          .from("team_patterns")
          .insert(payload)
          .select()
          .single();
        if (!error && inserted) upserted.push(inserted);
      }
    }

    // Log the action for audit
    await logAuditAction(
      context.supabaseClient,
      context.user.id,
      'detect_patterns',
      'team',
      teamId,
      {
        team_name: teamName,
        patterns_detected: upserted.length,
        pattern_types: params.pattern_types
      },
      context.user.email
    );

    console.log(`✅ Patterns detected for team ${teamName} (${teamId}): ${upserted.length} patterns by ${context.user.email}`);

    return new Response(
      JSON.stringify({ team_id: teamId, team_name: teamName, patterns: upserted }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("patterns-detect error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
