import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
interface PatternData {
  name: string;
  accuracy: number;
  total: number;
}
interface PatternPerformanceChartProps {
  data: PatternData[];
}
export default function PatternPerformanceChart({
  data
}: PatternPerformanceChartProps) {
  const getColor = (accuracy: number) => {
    if (accuracy >= 70) return "hsl(160, 84%, 39%)"; // primary
    if (accuracy >= 50) return "hsl(18, 100%, 60%)"; // secondary
    return "hsl(215, 20%, 65%)"; // muted
  };
  const formatPatternName = (name: string) => {
    const names: Record<string, string> = {
      home_winning_streak: "Hazai Sorozat",
      away_winning_streak: "Vendég Sorozat",
      h2h_dominance: "H2H Dominancia",
      recent_form_advantage: "Forma Előny",
      high_scoring_league: "Gólerős Liga"
    };
    return names[name] || name;
  };
  const formattedData = data.map(item => ({
    ...item,
    displayName: formatPatternName(item.name)
  }));
  return <Card className="glass-card border-border animate-fade-in">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Minta Teljesítmény</CardTitle>
        <p className="text-muted-foreground text-sm">
          Pattern pontosság százalékban
        </p>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? <div className="text-center text-muted-foreground py-12">
            Még nincs elég adat a minták teljesítményének megjelenítéséhez
          </div> : <ResponsiveContainer width="100%" height={300}>
            <BarChart data={formattedData} margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 60
        }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(215, 20%, 17%)" />
              <XAxis dataKey="displayName" angle={-45} textAnchor="end" height={80} tick={{
            fill: "hsl(215, 20%, 65%)",
            fontSize: 12
          }} />
              <YAxis domain={[0, 100]} tick={{
            fill: "hsl(215, 20%, 65%)"
          }} label={{
            value: "Pontosság (%)",
            angle: -90,
            position: "insideLeft",
            fill: "hsl(215, 20%, 65%)"
          }} />
              <Tooltip contentStyle={{
            backgroundColor: "hsl(11, 11%, 8%)",
            border: "1px solid hsl(215, 20%, 17%)",
            borderRadius: "0.5rem",
            color: "hsl(210, 40%, 98%)"
          }} labelStyle={{
            color: "hsl(210, 40%, 98%)"
          }} formatter={(value: number, _name: string, props: {
            payload: {
              total: number;
            };
          }) => [`${value.toFixed(1)}% (${props.payload.total} predikció)`, "Pontosság"]} />
              <Bar dataKey="accuracy" radius={[8, 8, 0, 0]}>
                {formattedData.map((entry, index) => <Cell key={`cell-${index}`} fill={getColor(entry.accuracy)} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>}
      </CardContent>
    </Card>;
}