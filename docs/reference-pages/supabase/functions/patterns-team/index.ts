import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Validation schema
const PatternsTeamSchema = z.object({
  team_name: z.string().optional(),
  team_id: z.string().uuid().optional(),
}).refine((data) => data.team_name || data.team_id, {
  message: "Either team_name or team_id must be provided",
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RequestBody {
  team_name?: string;
  team_id?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Create authenticated Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let params: RequestBody = {};
    if (req.method === "GET") {
      const url = new URL(req.url);
      params.team_name = url.searchParams.get("team_name") ?? undefined;
      params.team_id = url.searchParams.get("team_id") ?? undefined;
    } else {
      const body = await req.json()
      const validation = PatternsTeamSchema.safeParse(body)
      if (!validation.success) {
        return new Response(
          JSON.stringify({ error: 'Invalid input', details: validation.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      params = validation.data as RequestBody
    }

    let teamId = params.team_id ?? "";
    let teamName = params.team_name ?? "";

    if (!teamId) {
      const { data: team, error: teamError } = await supabase
        .from("teams")
        .select("id, name")
        .eq("name", teamName)
        .maybeSingle();

      if (teamError || !team) {
        return new Response(
          JSON.stringify({ error: "Team not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      teamId = team.id;
      teamName = team.name;
    }

    const nowIso = new Date().toISOString();

    const { data: patterns, error } = await supabase
      .from("team_patterns")
      .select("*")
      .eq("team_id", teamId)
      .order("valid_from", { ascending: false });

    if (error) {
      throw error;
    }

    const active = (patterns ?? []).filter((p) => p.valid_until === null || (p.valid_until as string) > nowIso);
    const expired = (patterns ?? []).filter((p) => p.valid_until !== null && (p.valid_until as string) <= nowIso);

    return new Response(
      JSON.stringify({ team_id: teamId, team_name: teamName, active_patterns: active, expired_patterns: expired }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("patterns-team error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
