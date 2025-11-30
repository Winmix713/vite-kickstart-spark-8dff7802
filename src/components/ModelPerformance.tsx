import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
interface ModelPerformanceData {
  id: string;
  model_name: string;
  model_version: string;
  accuracy: number;
  precision_score: number;
  recall_score: number;
  f1_score: number;
  time_period: string;
  total_predictions: number;
  correct_predictions: number;
  last_updated: string;
}
export const ModelPerformance = () => {
  const {
    data: performance,
    isLoading
  } = useQuery({
    queryKey: ['model-performance'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.from('model_performance').select('*').order('time_period', {
        ascending: false
      }).limit(6);
      if (error) throw error;
      return data as ModelPerformanceData[];
    }
  });
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Model Performance</CardTitle>
          <CardDescription>Loading performance metrics...</CardDescription>
        </CardHeader>
      </Card>;
  }
  const latestPerformance = performance?.[0];
  const chartData = performance?.map(p => ({
    period: p.time_period,
    accuracy: p.accuracy,
    precision: p.precision_score
  })).reverse();
  return <Card>
      <CardHeader>
        <CardTitle>Model Performance</CardTitle>
        <CardDescription>
          Tracking prediction accuracy over time
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {latestPerformance && <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">{latestPerformance.accuracy.toFixed(1)}%</p>
                <Progress value={latestPerformance.accuracy} className="h-2" />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Precision</p>
                <p className="text-2xl font-bold">{latestPerformance.precision_score.toFixed(1)}%</p>
                <Progress value={latestPerformance.precision_score} className="h-2" />
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Total Predictions</p>
                <p className="text-2xl font-bold">{latestPerformance.total_predictions}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Correct</p>
                <p className="text-2xl font-bold">{latestPerformance.correct_predictions}</p>
              </div>
            </div>

            {chartData && chartData.length > 1 && <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="accuracy" fill="hsl(var(--primary))" name="Accuracy %" />
                    <Bar dataKey="precision" fill="hsl(var(--secondary))" name="Precision %" />
                  </BarChart>
                </ResponsiveContainer>
              </div>}

            <p className="text-xs text-muted-foreground">
              Last updated: {new Date(latestPerformance.last_updated).toLocaleString()} • Model: {latestPerformance.model_name} {latestPerformance.model_version}
            </p>
          </>}

        {!latestPerformance && <p className="text-sm text-muted-foreground">
            No performance data available yet. Performance metrics will appear after predictions are evaluated.
          </p>}
      </CardContent>
    </Card>;
};