import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
interface AccuracyTrendData {
  week: string;
  total_predictions: number;
  accurate_predictions: number;
  accuracy_percentage: number;
  avg_confidence: number;
}
interface PredictionAccuracyChartProps {
  data: AccuracyTrendData[];
  isLoading?: boolean;
  error?: string | null;
}
const PredictionAccuracyChart: React.FC<PredictionAccuracyChartProps> = ({
  data,
  isLoading,
  error
}) => {
  if (isLoading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle>Weekly Accuracy Trends</CardTitle>
          <CardDescription>Loading prediction accuracy data...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle>Weekly Accuracy Trends</CardTitle>
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
          <CardTitle>Weekly Accuracy Trends</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-gray-400">No accuracy data to display</div>
        </CardContent>
      </Card>;
  }
  return <Card className="w-full">
      <CardHeader>
        <CardTitle>Weekly Accuracy Trends</CardTitle>
        <CardDescription>
          Prediction accuracy and confidence levels over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5
        }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" stroke="#666" style={{
            fontSize: '12px'
          }} />
            <YAxis yAxisId="left" stroke="#666" style={{
            fontSize: '12px'
          }} />
            <YAxis yAxisId="right" orientation="right" stroke="#666" style={{
            fontSize: '12px'
          }} />
            <Tooltip contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            borderRadius: '6px',
            color: '#e5e7eb'
          }} formatter={value => {
            if (typeof value === 'number') {
              return [value.toFixed(1), ''];
            }
            return value;
          }} />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="accuracy_percentage" stroke="#10b981" strokeWidth={2} dot={{
            fill: '#10b981',
            r: 4
          }} activeDot={{
            r: 6
          }} name="Accuracy %" />
            <Line yAxisId="right" type="monotone" dataKey="avg_confidence" stroke="#3b82f6" strokeWidth={2} dot={{
            fill: '#3b82f6',
            r: 4
          }} activeDot={{
            r: 6
          }} name="Avg Confidence" />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Accuracy</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {data.length > 0 ? Math.round(data.reduce((sum, d) => sum + d.accuracy_percentage, 0) / data.length) : 0}
              %
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Predictions</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.reduce((sum, d) => sum + d.total_predictions, 0)}
            </p>
          </div>
          <div className="rounded-lg bg-purple-50 dark:bg-purple-900/10 p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Accurate</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {data.reduce((sum, d) => sum + d.accurate_predictions, 0)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>;
};
export default PredictionAccuracyChart;