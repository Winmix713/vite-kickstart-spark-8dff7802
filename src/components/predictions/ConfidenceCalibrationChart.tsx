import React from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Line } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
interface CalibrationData {
  confidence_range: string;
  total_predictions: number;
  correct_predictions: number;
  calibration_score: number;
  sample_size: number;
}
interface ConfidenceCalibrationChartProps {
  data: CalibrationData[];
  isLoading?: boolean;
  error?: string | null;
}
const ConfidenceCalibrationChart: React.FC<ConfidenceCalibrationChartProps> = ({
  data,
  isLoading,
  error
}) => {
  if (isLoading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle>Confidence Calibration</CardTitle>
          <CardDescription>Loading calibration analysis...</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-gray-400">Loading...</div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle>Confidence Calibration</CardTitle>
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
          <CardTitle>Confidence Calibration</CardTitle>
          <CardDescription>No data available</CardDescription>
        </CardHeader>
        <CardContent className="h-80 flex items-center justify-center">
          <div className="text-gray-400">No calibration data to display</div>
        </CardContent>
      </Card>;
  }

  // Transform data for visualization
  const transformedData = data.map(item => ({
    ...item,
    x: parseFloat(item.confidence_range.split('-')[0]),
    y: item.calibration_score
  }));

  // Calculate calibration metrics
  const avgCalibration = Math.round(data.reduce((sum, d) => sum + d.calibration_score, 0) / data.length);
  const totalSamples = data.reduce((sum, d) => sum + d.sample_size, 0);
  const wellCalibrated = data.filter(d => Math.abs(d.calibration_score - (parseFloat(d.confidence_range.split('-')[0]) + parseFloat(d.confidence_range.split('-')[1])) / 2) < 10).length;
  return <Card className="w-full">
      <CardHeader>
        <CardTitle>Confidence Calibration Analysis</CardTitle>
        <CardDescription>
          How well predictions match actual confidence levels
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="rounded-lg bg-orange-50 dark:bg-orange-900/10 p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Calibration</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {avgCalibration}%
            </p>
          </div>
          <div className="rounded-lg bg-green-50 dark:bg-green-900/10 p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Samples</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {totalSamples}
            </p>
          </div>
          <div className="rounded-lg bg-blue-50 dark:bg-blue-900/10 p-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">Well Calibrated</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {wellCalibrated}/{data.length}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            Calibration by Confidence Range
          </h4>
          <div className="space-y-3">
            {data.map((row, idx) => <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{row.confidence_range}%</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {row.correct_predictions}/{row.total_predictions}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-6 rounded bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div className={`h-full transition-all ${row.calibration_score >= 70 ? 'bg-green-500' : row.calibration_score >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{
                  width: `${row.calibration_score}%`
                }} />
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {row.calibration_score}%
                  </span>
                </div>
              </div>)}
          </div>
        </div>

        <div className="mt-6 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
          <p className="text-sm text-blue-900 dark:text-blue-200">
            <strong>Interpretation:</strong> A well-calibrated model's confidence levels align with actual accuracy.
            If predictions with 80% confidence are correct 80% of the time, the model is well-calibrated.
          </p>
        </div>
      </CardContent>
    </Card>;
};
export default ConfidenceCalibrationChart;