import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DailyStats {
  total: number;
  correct: number;
}

interface DailyStatsMap {
  [date: string]: DailyStats;
}

interface RollingMetric {
  date: string;
  total_predictions: number;
  correct_predictions: number;
  accuracy_pct: number;
  rolling_3day_accuracy: number | null;
  rolling_7day_accuracy: number | null;
  accuracy_drop_pct: number | null;
  raw_payload?: Record<string, unknown>;
}

const calculateAccuracy = (
  dateRange: string[],
  dailyStats: DailyStatsMap
): number => {
  let totalCorrect = 0;
  let totalPredictions = 0;

  dateRange.forEach((date) => {
    if (dailyStats[date]) {
      totalCorrect += dailyStats[date].correct;
      totalPredictions += dailyStats[date].total;
    }
  });

  return totalPredictions > 0
    ? (totalCorrect / totalPredictions) * 100
    : 0;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const computeDecayMetrics = async (supabase: any) => {
  // 1. Fetch evaluated predictions from the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: predictions, error: predictionsError } = await supabase
    .from("predictions")
    .select("created_at, was_correct, evaluated_at, predicted_outcome, actual_outcome")
    .not("evaluated_at", "is", null)
    .gte("evaluated_at", thirtyDaysAgo.toISOString())
    .order("evaluated_at", { ascending: true });

  if (predictionsError) {
    throw new Error(`Failed to fetch predictions: ${predictionsError.message}`);
  }

  if (!predictions || predictions.length === 0) {
    console.log("No evaluated predictions found in the last 30 days");
    return {
      message: "No evaluated predictions found",
      stats_computed: 0,
      decay_events_created: 0,
    };
  }

  // 2. Aggregate predictions by date
  const dailyStats: DailyStatsMap = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  predictions.forEach((pred: any) => {
    const date = pred.evaluated_at.split("T")[0]; // Extract YYYY-MM-DD
    if (!dailyStats[date]) {
      dailyStats[date] = { total: 0, correct: 0 };
    }
    dailyStats[date].total++;
    if (pred.was_correct) {
      dailyStats[date].correct++;
    }
  });

  // 3. Calculate rolling windows for each date
  const dates = Object.keys(dailyStats).sort();
  const rollingStats: RollingMetric[] = dates.map((date, idx) => {
    const last3Days = dates.slice(Math.max(0, idx - 2), idx + 1);
    const last7Days = dates.slice(Math.max(0, idx - 6), idx + 1);

    const accuracy3Day = calculateAccuracy(last3Days, dailyStats);
    const accuracy7Day = calculateAccuracy(last7Days, dailyStats);

    // Calculate drop percentage: how much 3-day has dropped compared to 7-day
    const drop =
      accuracy7Day > 0
        ? ((accuracy7Day - accuracy3Day) / accuracy7Day) * 100
        : 0;

    const dailyAccuracy =
      dailyStats[date].total > 0
        ? (dailyStats[date].correct / dailyStats[date].total) * 100
        : 0;

    return {
      date,
      total_predictions: dailyStats[date].total,
      correct_predictions: dailyStats[date].correct,
      accuracy_pct: Math.round(dailyAccuracy * 100) / 100,
      rolling_3day_accuracy:
        last3Days.length >= 3 ? Math.round(accuracy3Day * 100) / 100 : null,
      rolling_7day_accuracy:
        last7Days.length >= 7 ? Math.round(accuracy7Day * 100) / 100 : null,
      accuracy_drop_pct: Math.max(0, Math.round(drop * 100) / 100),
      raw_payload: {
        last_3_days: last3Days,
        last_7_days: last7Days,
        date_range: { start: last7Days[0], end: date },
      },
    };
  });

  // 4. Upsert daily stats into prediction_accuracy_daily
  const { error: upsertError } = await supabase
    .from("prediction_accuracy_daily")
    .upsert(
      rollingStats.map((stat) => ({
        date: stat.date,
        total_predictions: stat.total_predictions,
        correct_predictions: stat.correct_predictions,
        accuracy_pct: stat.accuracy_pct,
        rolling_3day_accuracy: stat.rolling_3day_accuracy,
        rolling_7day_accuracy: stat.rolling_7day_accuracy,
        accuracy_drop_pct: stat.accuracy_drop_pct,
        raw_payload: stat.raw_payload,
      })),
      { onConflict: "date" }
    );

  if (upsertError) {
    throw new Error(`Failed to upsert daily stats: ${upsertError.message}`);
  }

  // 5. Detect decay events based on the latest stats
  const latestStat = rollingStats[rollingStats.length - 1];
  let decayEventsCreated = 0;

  // Only check for decay if we have enough data (at least 7 days)
  if (
    latestStat.rolling_3day_accuracy !== null &&
    latestStat.rolling_7day_accuracy !== null &&
    dates.length >= 7
  ) {
    const dropPct = latestStat.accuracy_drop_pct || 0;

    // Trigger alert if drop percentage is >= 20%
    if (dropPct >= 20) {
      // Check if there's already a pending event for today to avoid duplicates
      const { data: existingEvent } = await supabase
        .from("prediction_decay_events")
        .select("id")
        .eq("window_end", latestStat.date)
        .eq("status", "pending")
        .maybeSingle();

      if (!existingEvent) {
        const severity =
          dropPct >= 40 ? "severe" : dropPct >= 30 ? "critical" : "warning";

        const windowStart = dates[Math.max(0, dates.length - 7)];
        const windowEnd = dates[dates.length - 1];

        const { error: insertError } = await supabase
          .from("prediction_decay_events")
          .insert({
            window_start: windowStart,
            window_end: windowEnd,
            three_day_accuracy: latestStat.rolling_3day_accuracy,
            seven_day_avg_accuracy: latestStat.rolling_7day_accuracy,
            drop_percentage: dropPct,
            severity,
          });

        if (insertError) {
          console.error("Failed to create decay event:", insertError.message);
        } else {
          decayEventsCreated = 1;
          console.log(
            `Created ${severity} decay event: ${dropPct}% drop (7-day: ${latestStat.rolling_7day_accuracy}%, 3-day: ${latestStat.rolling_3day_accuracy}%)`
          );
        }
      } else {
        console.log("Pending decay event already exists for this period");
      }
    } else {
      console.log(
        `No significant decay detected (drop: ${dropPct}%, threshold: 20%)`
      );
    }
  } else {
    console.log("Insufficient data for decay detection (need at least 7 days)");
  }

  return {
    message: "Decay metrics computed successfully",
    stats_computed: rollingStats.length,
    decay_events_created: decayEventsCreated,
    latest_metrics: {
      date: latestStat.date,
      accuracy_3day: latestStat.rolling_3day_accuracy,
      accuracy_7day: latestStat.rolling_7day_accuracy,
      drop_percentage: latestStat.accuracy_drop_pct,
    },
  };
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const result = await computeDecayMetrics(supabase);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("model-decay-monitor error:", error);
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
