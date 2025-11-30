import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle, Activity, TrendingUp, Target } from "lucide-react";
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { PredictionConfidenceChart } from "./PredictionConfidenceChart";
import type { AnalyticsResponse } from "@/types/admin-model-status";
interface AnalyticsPanelProps {
  analytics: AnalyticsResponse;
}
export function AnalyticsPanel({
  analytics
}: AnalyticsPanelProps) {
  const {
    summary,
    timeSeriesData,
    confidenceTrend,
    systemStatus
  } = analytics;
  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "warning":
        return "text-yellow-600";
      case "degraded":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };
  return <div className="space-y-6">
      {/* Prediction Confidence Chart */}
      <PredictionConfidenceChart />

      {/* System Status Alert */}
      {systemStatus === "degraded" && <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Degraded</AlertTitle>
          <AlertDescription>
            Fail rate is above 30% ({summary.failRate.toFixed(1)}%). We recommend
            retraining the model with recent data to improve accuracy.
          </AlertDescription>
        </Alert>}

      {systemStatus === "warning" && <Alert>
          <Activity className="h-4 w-4" />
          <AlertTitle>Performance Warning</AlertTitle>
          <AlertDescription>
            Fail rate is elevated at {summary.failRate.toFixed(1)}%. Monitor closely
            and consider retraining if performance continues to decline.
          </AlertDescription>
        </Alert>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalPredictions}</div>
            <p className="text-xs text-muted-foreground">Last 100 records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.accuracy.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {summary.correctPredictions} correct
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Fail Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getStatusColor(systemStatus)}`}>
              {summary.failRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Status: {systemStatus}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(summary.avgConfidence * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Prediction confidence</p>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Confidence Trend
          </CardTitle>
          <CardDescription>
            Are predictions getting more confident over time?
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={confidenceTrend.slice(-50)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" tickFormatter={value => new Date(value).toLocaleDateString()} />
              <YAxis domain={[0, 1]} tickFormatter={value => `${(value * 100).toFixed(0)}%`} />
              <Tooltip labelFormatter={value => new Date(value).toLocaleString()} formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
              <Legend />
              <Line type="monotone" dataKey="confidence" stroke="#8884d8" strokeWidth={2} dot={{
              fill: "#8884d8",
              r: 3
            }} name="Confidence" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Accuracy vs Time Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Accuracy vs Time
          </CardTitle>
          <CardDescription>
            Daily accuracy and prediction volume trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" domain={[0, 100]} />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="accuracy" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} name="Accuracy (%)" />
              <Area yAxisId="right" type="monotone" dataKey="predictions" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} name="Predictions" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Daily Confidence Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Confidence Distribution</CardTitle>
          <CardDescription>
            Average confidence levels per day
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis domain={[0, 1]} tickFormatter={value => `${(value * 100).toFixed(0)}%`} />
              <Tooltip formatter={(value: number) => `${(value * 100).toFixed(1)}%`} />
              <Legend />
              <Bar dataKey="confidence" fill="#fbbf24" name="Avg Confidence" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>;
}