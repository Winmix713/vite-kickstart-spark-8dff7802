import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Zod schema for validation
const SupportingMatchSchema = z.object({
  match_id: z.number().optional(),
  date: z.string(),
  teams: z.string(),
});

const RarePatternSchema = z.object({
  pattern_key: z.string().min(1),
  label: z.string().min(1),
  frequency_pct: z.number().min(0).max(5),
  accuracy_pct: z.number().min(80).max(100),
  sample_size: z.number().int().min(5),
  supporting_matches: z.array(SupportingMatchSchema),
  discovered_at: z.string(),
  expires_at: z.string(),
  highlight_text: z.string().optional(),
});

const RequestSchema = z.object({
  patterns: z.array(RarePatternSchema),
});

type RarePattern = z.infer<typeof RarePatternSchema>;
type UpsertRequest = z.infer<typeof RequestSchema>;

/**
 * Upsert patterns into the high_value_patterns table
 * Handles pattern deduplication by pattern_key with 30-day expiry
 */
async function upsertPatterns(patterns: RarePattern[]): Promise<number> {
  const response = await fetch(`${supabaseUrl}/rest/v1/high_value_patterns`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${supabaseKey}`,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(
      patterns.map((pattern) => ({
        pattern_key: pattern.pattern_key,
        label: pattern.label,
        frequency_pct: pattern.frequency_pct,
        accuracy_pct: pattern.accuracy_pct,
        sample_size: pattern.sample_size,
        supporting_matches: pattern.supporting_matches,
        discovered_at: pattern.discovered_at,
        expires_at: pattern.expires_at,
        highlight_text: pattern.highlight_text || null,
        is_active: true,
        updated_at: new Date().toISOString(),
      }))
    ),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(
      `Failed to upsert patterns: ${response.status} - ${error}`
    );
  }

  return patterns.length;
}

/**
 * Mark expired patterns as inactive
 * Patterns older than their expires_at timestamp are deactivated
 */
async function deactivateExpiredPatterns(): Promise<number> {
  const response = await fetch(
    `${supabaseUrl}/rest/v1/high_value_patterns?is_active=eq.true&expires_at=lt.now()`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        is_active: false,
        updated_at: new Date().toISOString(),
      }),
    }
  );

  if (!response.ok && response.status !== 204) {
    const error = await response.text();
    console.error(
      `Warning: Failed to deactivate expired patterns: ${response.status} - ${error}`
    );
  }

  return 0; // Return value not critical for expired patterns
}

serve(async (req: Request) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  // Only accept POST requests
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Only POST requests are allowed" }),
      {
        status: 405,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  try {
    // Parse request body
    const body = await req.json();

    // Validate request schema
    const validationResult = RequestSchema.safeParse(body);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request schema",
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const request: UpsertRequest = validationResult.data;

    if (request.patterns.length === 0) {
      return new Response(
        JSON.stringify({
          message: "No patterns to sync",
          synced: 0,
          deactivated: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Upsert new patterns
    const syncedCount = await upsertPatterns(request.patterns);

    // Deactivate expired patterns
    await deactivateExpiredPatterns();

    return new Response(
      JSON.stringify({
        message: "Pattern sync completed successfully",
        synced: syncedCount,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Error in rare-pattern-sync:", error);

    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
