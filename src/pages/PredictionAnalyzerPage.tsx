import React, { useState } from 'react';
import { usePredictionAnalyzer } from '@/hooks/useEdgeFunction';
import PredictionAccuracyChart from '@/components/predictions/PredictionAccuracyChart';
import LeagueBreakdownChart from '@/components/predictions/LeagueBreakdownChart';
import ConfidenceCalibrationChart from '@/components/predictions/ConfidenceCalibrationChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
interface AnalyzerData {
  accuracy_trends?: Array<{
    week: string;
    total_predictions: number;
    accurate_predictions: number;
    accuracy_percentage: number;
    avg_confidence: number;
  }>;
  league_breakdown?: Array<{
    league: string;
    total_predictions: number;
    accurate_predictions: number;
    accuracy_percentage: number;
    avg_confidence: number;
    avg_accuracy_score: number;
  }>;
  confidence_calibration?: Array<{
    confidence_range: string;
    total_predictions: number;
    correct_predictions: number;
    calibration_score: number;
    sample_size: number;
  }>;
  period?: {
    start: string;
    end: string;
  };
}
const PredictionAnalyzerPage: React.FC = () => {
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedLeague, setSelectedLeague] = useState<string>('');
  const [showAllMetrics, setShowAllMetrics] = useState(true);
  const {
    data: analyzerData,
    isLoading,
    error
  } = usePredictionAnalyzer(showAllMetrics ? {
    start_date: startDate,
    end_date: endDate
  } : {
    start_date: startDate,
    end_date: endDate,
    league: selectedLeague || undefined
  }) as {
    data: AnalyzerData | null;
    isLoading: boolean;
    error: Error | null;
  };
  const handleReset = () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    setStartDate(date.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setSelectedLeague('');
  };

  // Extract metrics from analyzer data
  const accuracyTrends = analyzerData?.accuracy_trends || [];
  const leagueBreakdown = analyzerData?.league_breakdown || [];
  const confidenceCalibration = analyzerData?.confidence_calibration || [];

  // Calculate summary metrics
  const overallAccuracy = accuracyTrends.length > 0 ? Math.round(accuracyTrends.reduce((sum, d) => sum + d.accuracy_percentage, 0) / accuracyTrends.length) : 0;
  const totalPredictions = accuracyTrends.reduce((sum, d) => sum + d.total_predictions, 0);
  const totalAccurate = accuracyTrends.reduce((sum, d) => sum + d.accurate_predictions, 0);

  // Calculate ROI (simplified: assumes 1 unit per correct prediction, -1 for incorrect)
  const roi = totalPredictions > 0 ? Math.round((totalAccurate - (totalPredictions - totalAccurate)) / totalPredictions * 100) : 0;

  // Get top and worst performing leagues
  const topLeague = leagueBreakdown.length > 0 ? leagueBreakdown.reduce((best, current) => current.accuracy_percentage > best.accuracy_percentage ? current : best) : null;
  const worstLeague = leagueBreakdown.length > 0 ? leagueBreakdown.reduce((worst, current) => current.accuracy_percentage < worst.accuracy_percentage ? current : worst) : null;
  return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Prediction Analyzer
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Comprehensive analysis of prediction accuracy, confidence calibration, and league performance
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis Period & Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input id="start-date" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input id="end-date" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="league-select">League (Optional)</Label>
                <Select value={selectedLeague} onValueChange={setSelectedLeague}>
                  <SelectTrigger id="league-select">
                    <SelectValue placeholder="All leagues" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All leagues</SelectItem>
                    {leagueBreakdown.map(league => <SelectItem key={league.league} value={league.league}>
                        {league.league}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end gap-2">
                <Button onClick={handleReset} variant="outline" className="w-full">
                  Reset Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Overall Accuracy</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {overallAccuracy}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Predictions</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {totalPredictions}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Correct Predictions</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {totalAccurate}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">ROI</p>
                <p className={`text-3xl font-bold ${roi >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {roi > 0 ? '+' : ''}{roi}%
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Win Rate</p>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
                  {totalPredictions > 0 ? Math.round(totalAccurate / totalPredictions * 100) : 0}%
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance by League */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {topLeague && <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="text-base">Top Performing League</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {topLeague.league}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Accuracy</p>
                      <p className="font-bold">{topLeague.accuracy_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Predictions</p>
                      <p className="font-bold">{topLeague.total_predictions}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}
          {worstLeague && <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="text-base">Lowest Performing League</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-lg font-semibold text-red-600 dark:text-red-400">
                    {worstLeague.league}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Accuracy</p>
                      <p className="font-bold">{worstLeague.accuracy_percentage}%</p>
                    </div>
                    <div>
                      <p className="text-gray-600 dark:text-gray-400">Predictions</p>
                      <p className="font-bold">{worstLeague.total_predictions}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>}
        </div>

        {/* Charts */}
        <div className="space-y-6">
          <PredictionAccuracyChart data={accuracyTrends} isLoading={isLoading} error={error?.message} />
          <LeagueBreakdownChart data={leagueBreakdown} isLoading={isLoading} error={error?.message} />
          <ConfidenceCalibrationChart data={confidenceCalibration} isLoading={isLoading} error={error?.message} />
        </div>

        {/* Footer Info */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-blue-900 dark:text-blue-200">Analysis Insights</h4>
              <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-1">
                <li>• Overall accuracy shows the percentage of correct predictions across all analyzed matches</li>
                <li>• League breakdown helps identify which leagues are more predictable</li>
                <li>• Confidence calibration indicates how well the model's confidence aligns with actual performance</li>
                <li>• ROI calculation assumes +1 unit for correct predictions and -1 for incorrect ones</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default PredictionAnalyzerPage;