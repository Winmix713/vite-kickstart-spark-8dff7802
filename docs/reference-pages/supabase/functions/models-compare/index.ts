import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function erfc(x: number): number {
  const z = Math.abs(x);
  const t = 1 / (1 + 0.5 * z);
  const ans = t * Math.exp(
    -z * z - 1.26551223 +
    t * (1.00002368 +
      t * (0.37409196 +
        t * (0.09678418 +
          t * (-0.18628806 +
            t * (0.27886807 +
              t * (-1.13520398 +
                t * (1.48851587 +
                  t * (-0.82215223 + t * 0.17087277)
                )
              )
            )
          )
        )
      )
    )
  );
  return x >= 0 ? ans : 2 - ans;
}

function chiSquarePValue1df(chi2: number): number {
  // For 1 degree of freedom: p = erfc(sqrt(chi2/2))
  return erfc(Math.sqrt(chi2 / 2));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const body = await req.json();

    const { model_a_id, model_b_id, a_correct, a_total, b_correct, b_total, significance = 0.05 } = body ?? {};

    if (!model_a_id || !model_b_id || typeof a_correct !== "number" || typeof a_total !== "number" || typeof b_correct !== "number" || typeof b_total !== "number") {
      return new Response(
        JSON.stringify({ error: "model_a_id, model_b_id, a_correct, a_total, b_correct, b_total are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const a_incorrect = Math.max(0, a_total - a_correct);
    const b_incorrect = Math.max(0, b_total - b_correct);

    const row1 = a_correct + a_incorrect;
    const row2 = b_correct + b_incorrect;
    const col1 = a_correct + b_correct;
    const col2 = a_incorrect + b_incorrect;
    const n = row1 + row2;

    if (n === 0 || col1 === 0 && col2 === 0) {
      return new Response(JSON.stringify({ error: "Insufficient sample size" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const e11 = (row1 * col1) / n; const e12 = (row1 * col2) / n;
    const e21 = (row2 * col1) / n; const e22 = (row2 * col2) / n;

    const chi2 = (Math.pow(a_correct - e11, 2) / (e11 || 1)) +
                 (Math.pow(a_incorrect - e12, 2) / (e12 || 1)) +
                 (Math.pow(b_correct - e21, 2) / (e21 || 1)) +
                 (Math.pow(b_incorrect - e22, 2) / (e22 || 1));

    const p_value = chiSquarePValue1df(chi2);

    const aAcc = a_total > 0 ? a_correct / a_total : 0;
    const bAcc = b_total > 0 ? b_correct / b_total : 0;

    let winning_model: string | null = null;
    if (p_value < (typeof significance === "number" ? significance : 0.05)) {
      if (aAcc > bAcc) winning_model = model_a_id; else if (bAcc > aAcc) winning_model = model_b_id; else winning_model = null;
    }

    const accuracy_diff = Math.round((aAcc - bAcc) * 10000) / 100;
    const sample_size = n;

    // Persist the comparison
    const { data, error } = await supabase
      .from("model_comparison")
      .insert({
        model_a_id,
        model_b_id,
        accuracy_diff,
        p_value,
        winning_model,
        sample_size,
      })
      .select()
      .single();

    if (error) {
      console.error("models-compare insert error", error);
    }

    return new Response(
      JSON.stringify({ model_a_id, model_b_id, a_correct, a_total, b_correct, b_total, chi2, p_value, winning_model, accuracy_diff, sample_size, record: data }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("models-compare error", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
