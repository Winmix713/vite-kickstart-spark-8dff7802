import React from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend, ResponsiveContainer, Tooltip } from "recharts";
import type { LeagueRadarMetric } from "./LeagueComparisonRadarChart.types";
interface Props {
  data: LeagueRadarMetric[];
}
const metricLabels: Record<keyof LeagueRadarMetric["metrics"], string> = {
  goals: "Scoring",
  home_adv: "Home Adv",
  balance: "Balance",
  predictability: "Predictability",
  physicality: "Physicality"
};
const LeagueComparisonRadarChart: React.FC<Props> = ({
  data
}) => {
  const categories = Object.keys(metricLabels) as (keyof LeagueRadarMetric["metrics"])[];
  type ChartRow = {
    metric: string;
  } & Record<string, number | string>;
  const chartData: ChartRow[] = categories.map(cat => {
    const row: ChartRow = {
      metric: metricLabels[cat]
    };
    data.forEach(d => {
      row[d.leagueName] = d.metrics[cat];
    });
    return row;
  });
  const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];
  return <div className="w-full h-[380px]">
      <ResponsiveContainer>
        <RadarChart data={chartData} outerRadius={110}>
          <PolarGrid />
          <PolarAngleAxis dataKey="metric" tick={{
          fill: "#6b7280",
          fontSize: 11
        }} />
          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{
          fill: "#9ca3af",
          fontSize: 10
        }} />
          {data.map((d, i) => <Radar key={d.leagueId} name={d.leagueName} dataKey={d.leagueName} stroke={colors[i % colors.length]} fill={colors[i % colors.length]} fillOpacity={0.25} />)}
          <Tooltip />
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>;
};
export default LeagueComparisonRadarChart;