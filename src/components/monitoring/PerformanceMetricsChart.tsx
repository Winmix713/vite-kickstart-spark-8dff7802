import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
import type { MetricsPoint } from "./PerformanceMetricsChart.types";
interface Props {
  title?: string;
  data: MetricsPoint[];
}
export const PerformanceMetricsChart = memo(function PerformanceMetricsChart({
  title = "Latency over time",
  data
}: Props) {
  return <Card className="border-border/60 bg-muted/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{
          top: 8,
          right: 16,
          left: 0,
          bottom: 8
        }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
            <XAxis dataKey="time" tickFormatter={t => new Date(t).toLocaleTimeString()} stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip labelFormatter={l => new Date(l as string).toLocaleString()} />
            <Legend />
            <Line type="monotone" dataKey="p50" name="p50" stroke="#22c55e" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="p95" name="p95" stroke="#eab308" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="p99" name="p99" stroke="#ef4444" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>;
});
PerformanceMetricsChart.displayName = 'PerformanceMetricsChart';
export default PerformanceMetricsChart;