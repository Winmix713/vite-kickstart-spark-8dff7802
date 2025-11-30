import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
interface LeagueBreakdownData {
  league: string;
  total_predictions: number;
  accurate_predictions: number;
  accuracy_percentage: number;
  avg_confidence: number;
  avg_accuracy_score: number;
}
interface LeagueBreakdownChartProps {
  data: LeagueBreakdownData[];
  isLoading?: boolean;
  error?: string | null;
}
const LeagueBreakdownChart: React.FC<LeagueBreakdownChartProps> = ({
  data,
  isLoading,
  error
}) => {
  if (isLoading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle>League Performance Breakdown</CardTitle>
          <CardDescription>Loading league analysis...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle>League Performance Breakdown</CardTitle>
          <CardDescription>Error loading data</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-red-400">{error}</div>
        </CardContent>
      </Card>;
  }
  if (!data || data.length === 0) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle>League Performance Breakdown</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-gray-400">No league data to display</div>
        </CardContent>
      </Card>;
  }
  return <Card className="w-full">
      <CardHeader>
        <CardTitle>League Performance Breakdown</CardTitle>
        <CardDescription>
          Prediction accuracy by league
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5
        }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="league" stroke="#666" style={{
            fontSize: '12px'
          }} angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#666" style={{
            fontSize: '12px'
          }} />
            <Tooltip contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#e5e7eb'
          }} formatter={value => {
            if (typeof value === 'number') {
              return value.toFixed(1);
            }
            return value;
          }} />
            <Legend />
            <Bar dataKey="accuracy_percentage" fill="#10b981" name="Accuracy %" radius={[8, 8, 0, 0]} />
            <Bar dataKey="avg_confidence" fill="#3b82f6" name="Avg Confidence" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        <div className="mt-6">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Detailed League Stats
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-200 dark:border-gray-700">
                <tr className="text-gray-600 dark:text-gray-400">
                  <th className="text-left py-2 px-2">League</th>
                  <th className="text-center py-2 px-2">Total</th>
                  <th className="text-center py-2 px-2">Correct</th>
                  <th className="text-center py-2 px-2">Accuracy</th>
                  <th className="text-center py-2 px-2">Avg Score</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, idx) => <tr key={idx} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                    <td className="py-2 px-2 font-medium">{row.league}</td>
                    <td className="py-2 px-2 text-center">{row.total_predictions}</td>
                    <td className="py-2 px-2 text-center text-green-600 dark:text-green-400 font-semibold">
                      {row.accurate_predictions}
                    </td>
                    <td className="py-2 px-2 text-center">{row.accuracy_percentage}%</td>
                    <td className="py-2 px-2 text-center text-blue-600 dark:text-blue-400">
                      {row.avg_accuracy_score.toFixed(2)}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default LeagueBreakdownChart;