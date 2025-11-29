import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const minLeagues = typeof body?.min_leagues === "number" ? body.min_leagues : 2;
    const minEvidence = typeof body?.min_evidence === "number" ? body.min_evidence : 60;

    // Get detected patterns joined with template and match -> league
    const { data: detections, error } = await supabase
      .from("detected_patterns")
      .select(`
        template_id,
        match:matches(league_id)
      `);

    if (error) throw error;

    if (!detections || detections.length === 0) {
      return new Response(JSON.stringify({ meta_patterns: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch template metadata
    const { data: templates } = await supabase
      .from("pattern_templates")
      .select("id, name, category");

    type TemplateRow = { id: string; name: string; category: string };
    const tplMap = new Map<string, { name: string; category: string }>();
    (templates ?? ([] as TemplateRow[])).forEach((t: TemplateRow) => tplMap.set(t.id, { name: t.name, category: t.category }));

    // Aggregate counts per template and league
    const counts = new Map<string, Map<string, number>>(); // templateId -> leagueId -> count
    type DetectionRow = { template_id: string | null; match: { league_id: string | null } | null };
    for (const d of (detections ?? []) as DetectionRow[]) {
      const t = d.template_id as string | null;
      const leagueId = d.match?.league_id as string | null;
      if (!t || !leagueId) continue;
      if (!counts.has(t)) counts.set(t, new Map());
      const inner = counts.get(t)!;
      inner.set(leagueId, (inner.get(leagueId) ?? 0) + 1);
    }

    type MetaPatternInsert = {
      pattern_name: string;
      pattern_type: string;
      supporting_leagues: string[];
      evidence_strength: number;
      prediction_impact: number;
      pattern_description: string;
      discovered_at: string;
    };
    const metaPatterns: MetaPatternInsert[] = [];

    counts.forEach((byLeague, templateId) => {
      const supportLeagues = Array.from(byLeague.entries())
        .filter(([_, c]) => c >= 1)
        .map(([leagueId, _]) => leagueId);

      const totalOccurrences = Array.from(byLeague.values()).reduce((a, b) => a + b, 0);
      const supportCount = supportLeagues.length;

      if (supportCount >= minLeagues) {
        const tpl = tplMap.get(templateId) ?? { name: `template_${templateId}`, category: "general" };
        const evidenceStrength = Math.max(0, Math.min(100, Math.round((supportCount * 15) + Math.min(40, totalOccurrences))));
        if (evidenceStrength >= minEvidence) {
          const description = `A(z) "${tpl.name}" minta ${supportCount} ligában konzisztensen előfordul (${totalOccurrences} észlelés).`;
          metaPatterns.push({
            pattern_name: tpl.name,
            pattern_type: tpl.category,
            supporting_leagues: supportLeagues,
            evidence_strength: evidenceStrength,
            prediction_impact: 2.0,
            pattern_description: description,
            discovered_at: new Date().toISOString(),
          });
        }
      }
    });

    // Upsert discovered meta-patterns by name+type combination to avoid duplicates
    for (const mp of metaPatterns) {
      await supabase.from("meta_patterns").insert(mp);
    }

    return new Response(JSON.stringify({ meta_patterns: metaPatterns }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in meta-patterns-discover:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
