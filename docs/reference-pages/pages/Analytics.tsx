import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ModelPerformanceChart, { PerformancePoint } from "@/components/analytics/ModelPerformanceChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";

interface PredictionRow {
  created_at: string;
  predicted_outcome: "home_win" | "draw" | "away_win";
  confidence_score: number;
  css_score: number | null;
  was_correct: boolean | null;
}

function formatDate(dateIso: string): string {
  const d = new Date(dateIso);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function Analytics() {
  useDocumentTitle("Analytics • WinMix TipsterHub");
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<PerformancePoint[]>([]);
  const [summary, setSummary] = useState({ total: 0, accuracy: 0, avgCalibrationError: 0 });
  const [cssScoreCount, setCssScoreCount] = useState(0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    try {
      setLoading(true);
      const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("predictions")
        .select("created_at, predicted_outcome, confidence_score, css_score, was_correct")
        .gte("created_at", since)
        .order("created_at", { ascending: true });

      if (error) throw error;

      const rows: PredictionRow[] = (data ?? []) as unknown as PredictionRow[];

      // Group by date
      const byDate = new Map<string, PredictionRow[]>();
      for (const r of rows) {
        const key = formatDate(r.created_at);
        if (!byDate.has(key)) byDate.set(key, []);
        byDate.get(key)!.push(r);
      }

      const dayKeys = Array.from(byDate.keys()).sort();
      const perf: PerformancePoint[] = dayKeys.map((day) => {
        const items = byDate.get(day)!;
        const evals = items.filter((i) => i.was_correct !== null);
        const total = evals.length;
        const correct = evals.filter((i) => i.was_correct === true).length;
        const overall = total > 0 ? (correct / total) * 100 : 0;

        const calc = (type: "home_win" | "draw" | "away_win") => {
          const subset = evals.filter((i) => i.predicted_outcome === type);
          const t = subset.length;
          const c = subset.filter((i) => i.was_correct).length;
          return t > 0 ? (c / t) * 100 : 0;
        };

        return {
          date: day,
          overall,
          home_win: calc("home_win"),
          draw: calc("draw"),
          away_win: calc("away_win"),
        };
      });

      setPoints(perf);

      // CSS score availability for UI messaging
      const cssScores = rows
        .filter((p) => p.css_score !== null && p.css_score !== undefined)
        .map((p) => p.css_score as number);
      setCssScoreCount(cssScores.length);

      // Summary
      const allEvals = rows.filter((i) => i.was_correct !== null);
      const total = allEvals.length;
      const correct = allEvals.filter((i) => i.was_correct === true).length;
      const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

      // Calibration error: |p - y| where p is css_score/confidence_score in [0,1]
      const errors: number[] = allEvals.map((i) => {
        const p = (i.css_score ?? i.confidence_score) / 100;
        const y = i.was_correct ? 1 : 0;
        return Math.abs(p - y);
      });
      const avgCalibrationError = errors.length > 0 ? Number((errors.reduce((a, b) => a + b, 0) / errors.length).toFixed(3)) : 0;

      setSummary({ total, accuracy, avgCalibrationError });
    } catch (err) {
      console.error("Failed to load analytics", err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <PageLayout>
        <div className="mb-8">
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <PageHeader title="Analytics" description="Hosszú távú modell teljesítmény, kalibráció, összehasonlítás" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle>Összes értékelt predikció</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.total}</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle>Összpontosság</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.accuracy}%</div>
          </CardContent>
        </Card>
        <Card className="glass-card border-border">
          <CardHeader>
            <CardTitle>Átlagos kalibrációs hiba</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{summary.avgCalibrationError}</div>
            <p className="text-muted-foreground text-xs">|p - y| átlag, 0 a jobb</p>
          </CardContent>
        </Card>
      </div>

      {cssScoreCount === 0 && (
        <div className="p-4 rounded-lg mb-6 border border-yellow-500/20 bg-yellow-500/10 text-yellow-300">
          No CSS scores available yet. Predictions are being processed.
        </div>
      )}

      <ModelPerformanceChart data={points} />
    </PageLayout>
  );
}
