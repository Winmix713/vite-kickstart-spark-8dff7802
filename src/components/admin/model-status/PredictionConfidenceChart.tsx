import { useState, memo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
interface AnalyticsResponse {
  summary: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    failRate: number;
    avgConfidence: number;
  };
  timeSeriesData: Array<{
    date: string;
    accuracy: number;
    confidence: number;
    predictions: number;
  }>;
  confidenceTrend: Array<{
    timestamp: string;
    confidence: number;
    isCorrect: boolean;
  }>;
  windowDays: number;
  systemStatus: "healthy" | "warning" | "degraded";
}
interface PredictionConfidenceChartProps {
  className?: string;
}
export const PredictionConfidenceChart = memo(function PredictionConfidenceChart({
  className
}: PredictionConfidenceChartProps) {
  const [windowDays, setWindowDays] = useState(7);
  const {
    data: analytics,
    isLoading,
    error
  } = useQuery<AnalyticsResponse>({
    queryKey: ["admin-model-analytics", windowDays],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.functions.invoke<AnalyticsResponse>("admin-model-analytics", {
        body: {
          window_days: windowDays
        }
      });
      if (error) throw new Error(error.message);
      return data;
    },
    refetchInterval: 60000 // Refetch every minute
  });
  const handleWindowChange = (days: number) => {
    setWindowDays(days);
  };
  if (error) {
    return <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Prediction Confidence & Accuracy
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-destructive">
            Error loading analytics: {error.message}
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className={className}>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Prediction Confidence & Accuracy
            </CardTitle>
            <CardDescription>
              Track model confidence and accuracy trends over time
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant={windowDays === 7 ? "default" : "outline"} size="sm" onClick={() => handleWindowChange(7)}>
              7 days
            </Button>
            <Button variant={windowDays === 30 ? "default" : "outline"} size="sm" onClick={() => handleWindowChange(30)}>
              30 days
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? <div className="space-y-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-64 w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div> : analytics ? <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Period</p>
                <div className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  <p className="text-sm font-medium">Last {windowDays} days</p>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Accuracy</p>
                <p className="text-sm font-medium">{analytics.summary.accuracy.toFixed(1)}%</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Avg Confidence</p>
                <p className="text-sm font-medium">
                  {(analytics.summary.avgConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Total Predictions</p>
                <p className="text-sm font-medium">{analytics.summary.totalPredictions}</p>
              </div>
            </div>

            {/* Dual Axis Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.timeSeriesData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickFormatter={value => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                });
              }} />
                  <YAxis yAxisId="accuracy" domain={[0, 100]} tickFormatter={value => `${value}%`} />
                  <YAxis yAxisId="confidence" orientation="right" domain={[0, 1]} tickFormatter={value => `${(value * 100).toFixed(0)}%`} />
                  <Tooltip labelFormatter={value => new Date(value).toLocaleDateString()} formatter={(value: number, name: string) => {
                if (name === "accuracy") {
                  return [`${value.toFixed(1)}%`, "Accuracy"];
                }
                if (name === "confidence") {
                  return [`${(value * 100).toFixed(1)}%`, "Avg Confidence"];
                }
                return [value, name];
              }} />
                  <Legend />
                  <Line yAxisId="accuracy" type="monotone" dataKey="accuracy" stroke="#10b981" strokeWidth={2} dot={{
                fill: "#10b981",
                r: 4
              }} name="Accuracy" />
                  <Line yAxisId="confidence" type="monotone" dataKey="confidence" stroke="#3b82f6" strokeWidth={2} dot={{
                fill: "#3b82f6",
                r: 4
              }} name="Avg Confidence" />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* System Status Badge */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">System Status:</span>
                <Badge variant={analytics.systemStatus === "healthy" ? "default" : analytics.systemStatus === "warning" ? "secondary" : "destructive"} className="gap-1">
                  {analytics.systemStatus === "healthy" && <TrendingUp className="w-3 h-3" />}
                  {analytics.systemStatus === "warning" && <TrendingDown className="w-3 h-3" />}
                  {analytics.systemStatus === "degraded" && <TrendingDown className="w-3 h-3" />}
                  {analytics.systemStatus.charAt(0).toUpperCase() + analytics.systemStatus.slice(1)}
                </Badge>
              </div>
              <div className="text-xs text-muted-foreground">
                {analytics.summary.correctPredictions} of {analytics.summary.totalPredictions} predictions correct
              </div>
            </div>
          </div> : null}
      </CardContent>
    </Card>;
});
PredictionConfidenceChart.displayName = 'PredictionConfidenceChart';