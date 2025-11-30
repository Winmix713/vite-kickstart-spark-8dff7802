import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from "recharts";
export interface PerformancePoint {
  date: string;
  overall: number;
  home_win: number;
  draw: number;
  away_win: number;
}
interface Props {
  data: PerformancePoint[];
}
export default function ModelPerformanceChart({
  data
}: Props) {
  return <Card className="border-border/60 bg-muted/20">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Model Performance Over Time</CardTitle>
      </CardHeader>
      <CardContent className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{
          top: 8,
          right: 16,
          left: 0,
          bottom: 8
        }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground) / 0.2)" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" label={{
            value: 'Accuracy (%)',
            angle: -90,
            position: 'insideLeft'
          }} />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="overall" name="Overall" stroke="#22c55e" strokeWidth={2} />
            <Line type="monotone" dataKey="home_win" name="Home Win" stroke="#3b82f6" strokeWidth={1.5} />
            <Line type="monotone" dataKey="draw" name="Draw" stroke="#eab308" strokeWidth={1.5} />
            <Line type="monotone" dataKey="away_win" name="Away Win" stroke="#ef4444" strokeWidth={1.5} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>;
}