// Phase 9: Market Signal Correlation Analysis Component

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  BarChart3,
  RefreshCw,
  Download,
  AlertCircle,
  Eye,
  Target,
  TrendingUp,
  Zap,
  Activity,
  Brain,
  ScatterChart,
  TrendingDown
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { MarketCorrelationService } from '@/lib/phase9-api';
import type { 
  MarketSignal,
  SignalCorrelationResult,
  SignalCorrelationMatrix,
  TimeSeriesCorrelation,
  CrossLeagueCorrelation
} from '@/types/phase9';

// Custom colors for correlation visualization
const CORRELATION_COLORS = {
  strong_positive: '#10b981',
  moderate_positive: '#22c55e',
  weak_positive: '#86efac',
  no_correlation: '#6b7280',
  weak_negative: '#fca5a5',
  moderate_negative: '#f87171',
  strong_negative: '#ef4444',
  significant: '#8b5cf6'
} as const;

const CORRELATION_THRESHOLDS = {
  strong_positive: 0.7,
  moderate_positive: 0.5,
  weak_positive: 0.3,
  no_correlation_lower: -0.3,
  no_correlation_upper: 0.3,
  moderate_negative: -0.5,
  strong_negative: -0.7
} as const;

interface MarketSignalCorrelationProps {
  leagueId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  enableRealTime?: boolean;
  showAdvanced?: boolean;
  signalTypes?: string[];
}

export const MarketSignalCorrelation: React.FC<MarketSignalCorrelationProps> = ({
  leagueId = 'all',
  timeRange = '30d',
  enableRealTime = true,
  showAdvanced = true,
  signalTypes = ['odds_movement', 'volume_change', 'social_sentiment', 'prediction_accuracy']
}) => {
  const [signals, setSignals] = useState<MarketSignal[]>([]);
  const [correlationResults, setCorrelationResults] = useState<SignalCorrelationResult[]>([]);
  const [correlationMatrix, setCorrelationMatrix] = useState<SignalCorrelationMatrix | null>(null);
  const [timeSeriesData, setTimeSeriesData] = useState<TimeSeriesCorrelation[]>([]);
  const [crossLeagueData, setCrossLeagueData] = useState<CrossLeagueCorrelation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'scatter' | 'timeseries' | 'crossleague'>('matrix');
  const [selectedSignals, setSelectedSignals] = useState<string[]>([]);
  const [filterThreshold, setFilterThreshold] = useState(0.3);
  const [showInsignificant, setShowInsignificant] = useState(false);

  // Fetch signals and perform correlation analysis
  const fetchSignalsAndAnalyze = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch market signals
      const signalsResult = await MarketCorrelationService.fetchMarketSignals({
        leagueId,
        timeRange,
        signalTypes
      });
      
      if (!signalsResult.success) {
        throw new Error(signalsResult.error || 'Failed to fetch market signals');
      }
      
      const signalData = signalsResult.signals || [];
      setSignals(signalData);
      
      // Perform correlation analysis
      await performCorrelationAnalysis(signalData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market signals';
      setError(errorMessage);
      toast({
        title: 'Analysis Error',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [leagueId, timeRange, signalTypes]);

  // Perform comprehensive correlation analysis
  const performCorrelationAnalysis = async (signalData: MarketSignal[]) => {
    try {
      setIsAnalyzing(true);
      
      // Basic correlation matrix
      const matrixResult = await MarketCorrelationService.calculateCorrelationMatrix(
        signalData,
        {
          method: 'pearson',
          minPeriods: 10,
          includeLagCorrelations: true,
          lagPeriods: [1, 3, 7, 14]
        }
      );
      
      if (matrixResult.success && matrixResult.matrix) {
        setCorrelationMatrix(matrixResult.matrix);
      }
      
      // Time series correlation analysis
      const timeSeriesResult = await MarketCorrelationService.analyzeTimeSeriesCorrelation(
        signalData,
        {
          windowSize: 30,
          stepSize: 7,
          seasonalAdjustment: true
        }
      );
      
      if (timeSeriesResult.success) {
        setTimeSeriesData(timeSeriesResult.timeSeriesData || []);
      }
      
      // Cross-league correlation (if enabled)
      if (showAdvanced && leagueId !== 'all') {
        const crossLeagueResult = await MarketCorrelationService.analyzeCrossLeagueCorrelation(
          leagueId,
          signalData
        );
        
        if (crossLeagueResult.success) {
          setCrossLeagueData(crossLeagueResult.crossLeagueData || []);
        }
      }
      
      // Extract individual correlations for detailed view
      const individualCorrelations = matrixResult.matrix?.correlations || [];
      setCorrelationResults(individualCorrelations);
      
    } catch (err) {
      console.error('Correlation analysis failed:', err);
      toast({
        title: 'Analysis Warning',
        description: 'Some correlation calculations failed',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter correlations based on threshold and significance
  const filteredCorrelations = useMemo(() => {
    return correlationResults.filter(result => {
      const meetsThreshold = Math.abs(result.correlation_coefficient) >= filterThreshold;
      const isSignificant = result.p_value < 0.05;
      return meetsThreshold && (showInsignificant || isSignificant);
    }).sort((a, b) => Math.abs(b.correlation_coefficient) - Math.abs(a.correlation_coefficient));
  }, [correlationResults, filterThreshold, showInsignificant]);

  // Helper functions for visualization
  const getCorrelationColor = (coefficient: number): string => {
    const abs = Math.abs(coefficient);
    if (abs >= CORRELATION_THRESHOLDS.strong_positive) return coefficient > 0 ? 'strong_positive' : 'strong_negative';
    if (abs >= CORRELATION_THRESHOLDS.moderate_positive) return coefficient > 0 ? 'moderate_positive' : 'moderate_negative';
    if (abs >= CORRELATION_THRESHOLDS.weak_positive) return coefficient > 0 ? 'weak_positive' : 'weak_negative';
    return 'no_correlation';
  };

  const formatCorrelation = (coefficient: number): string => {
    return `${coefficient > 0 ? '+' : ''}${coefficient.toFixed(3)}`;
  };

  const getSignificanceIndicator = (pValue: number): { icon: React.ReactNode; color: string } => {
    if (pValue < 0.001) return { icon: <Brain className="h-4 w-4" />, color: 'text-green-600' };
    if (pValue < 0.01) return { icon: <Target className="h-4 w-4" />, color: 'text-blue-600' };
    if (pValue < 0.05) return { icon: <Zap className="h-4 w-4" />, color: 'text-yellow-600' };
    return { icon: <AlertCircle className="h-4 w-4" />, color: 'text-gray-400' };
  };

  const getCorrelationCategory = (coefficient: number): string => {
    const abs = Math.abs(coefficient);
    if (abs >= CORRELATION_THRESHOLDS.strong_positive) return coefficient > 0 ? 'strong_positive' : 'strong_negative';
    if (abs >= CORRELATION_THRESHOLDS.moderate_positive) return coefficient > 0 ? 'moderate_positive' : 'moderate_negative';
    if (abs >= CORRELATION_THRESHOLDS.weak_positive) return coefficient > 0 ? 'weak_positive' : 'weak_negative';
    return 'no_correlation';
  };

  // Export correlation data
  const exportCorrelationData = () => {
    const exportData = {
      metadata: {
        timestamp: new Date().toISOString(),
        leagueId,
        timeRange,
        signalTypes,
        filterThreshold,
        totalSignals: signals.length,
        totalCorrelations: correlationResults.length,
        significantCorrelations: filteredCorrelations.length
      },
      individualCorrelations: filteredCorrelations,
      timeSeriesCorrelations: timeSeriesData,
      crossLeagueCorrelations: crossLeagueData
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `correlation-analysis-${leagueId}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Export Complete',
      description: 'Correlation analysis data exported successfully'
    });
  };

  // Initialize on mount
  useEffect(() => {
    fetchSignalsAndAnalyze();
  }, [fetchSignalsAndAnalyze]);

  // Real-time updates
  useEffect(() => {
    if (!enableRealTime) return;
    
    const interval = setInterval(() => {
      fetchSignalsAndAnalyze();
    }, 5 * 60 * 1000); // Update every 5 minutes
    
    return () => clearInterval(interval);
  }, [enableRealTime, fetchSignalsAndAnalyze]);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Signal Correlation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Analyzing market signals...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Market Signal Correlation Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={fetchSignalsAndAnalyze} className="mt-4 w-full" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry Analysis
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Market Signal Correlation Analysis
              {isAnalyzing && <Loader2 className="h-4 w-4 animate-spin" />}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={exportCorrelationData}
                size="sm"
                variant="outline"
                disabled={!correlationResults.length}
              >
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
              <Button
                onClick={fetchSignalsAndAnalyze}
                size="sm"
                variant="outline"
                disabled={isAnalyzing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* View Mode Selector */}
            <div>
              <label className="text-sm font-medium mb-2 block">View Mode</label>
              <Select value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matrix">Correlation Matrix</SelectItem>
                  <SelectItem value="scatter">Scatter Analysis</SelectItem>
                  <SelectItem value="timeseries">Time Series</SelectItem>
                  {showAdvanced && <SelectItem value="crossleague">Cross-League</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Threshold */}
            <div>
              <label className="text-sm font-medium mb-2 block">Min Correlation Strength</label>
              <Select value={filterThreshold.toString()} onValueChange={(value) => setFilterThreshold(parseFloat(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.1">Very Weak (0.1)</SelectItem>
                  <SelectItem value="0.3">Weak (0.3)</SelectItem>
                  <SelectItem value="0.5">Moderate (0.5)</SelectItem>
                  <SelectItem value="0.7">Strong (0.7)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Signal Selection */}
            <div>
              <label className="text-sm font-medium mb-2 block">Signal Filters</label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-insignificant"
                  checked={showInsignificant}
                  onCheckedChange={setShowInsignificant}
                />
                <label htmlFor="show-insignificant" className="text-sm">Show Insignificant</label>
              </div>
            </div>

            {/* Real-time Toggle */}
            {enableRealTime && (
              <div>
                <label className="text-sm font-medium mb-2 block">Real-time Updates</label>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-green-600">Live</span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Signals</p>
                <p className="text-2xl font-bold">{signals.length}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Significant Correlations</p>
                <p className="text-2xl font-bold">{filteredCorrelations.length}</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Avg Correlation</p>
                <p className="text-2xl font-bold">
                  {filteredCorrelations.length > 0 
                    ? (filteredCorrelations.reduce((sum, c) => sum + Math.abs(c.correlation_coefficient), 0) / filteredCorrelations.length).toFixed(3)
                    : "0.000"
                  }
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Strongest Signal</p>
                <p className="text-lg font-bold truncate">
                  {filteredCorrelations.length > 0 
                    ? `${filteredCorrelations[0].signal1} ↔ ${filteredCorrelations[0].signal2}`
                    : "None"
                  }
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      {viewMode === 'matrix' && correlationMatrix && (
        <CorrelationMatrixView
          matrix={correlationMatrix}
          selectedSignals={selectedSignals}
          onSignalSelect={setSelectedSignals}
          getCorrelationColor={getCorrelationColor}
          formatCorrelation={formatCorrelation}
        />
      )}

      {viewMode === 'scatter' && (
        <ScatterAnalysisView
          correlations={filteredCorrelations}
          getCorrelationColor={getCorrelationColor}
          formatCorrelation={formatCorrelation}
          getSignificanceIndicator={getSignificanceIndicator}
        />
      )}

      {viewMode === 'timeseries' && timeSeriesData.length > 0 && (
        <TimeSeriesCorrelationView
          timeSeriesData={timeSeriesData}
          getCorrelationColor={getCorrelationColor}
        />
      )}

      {viewMode === 'crossleague' && crossLeagueData.length > 0 && (
        <CrossLeagueCorrelationView
          crossLeagueData={crossLeagueData}
          getCorrelationColor={getCorrelationColor}
        />
      )}

      {/* Detailed Correlations Table */}
      {filteredCorrelations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Detailed Correlation Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Signal 1</th>
                    <th className="text-left p-2">Signal 2</th>
                    <th className="text-center p-2">Correlation</th>
                    <th className="text-center p-2">P-Value</th>
                    <th className="text-center p-2">Significance</th>
                    <th className="text-center p-2">Lag (days)</th>
                    <th className="text-center p-2">Strength</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCorrelations.slice(0, 20).map((result, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{result.signal1}</td>
                      <td className="p-2 font-medium">{result.signal2}</td>
                      <td className={`text-center p-2 font-semibold`} style={{ color: getCorrelationColor(result.correlation_coefficient) }}>
                        {formatCorrelation(result.correlation_coefficient)}
                      </td>
                      <td className="text-center p-2">{result.p_value.toFixed(4)}</td>
                      <td className="text-center p-2">
                        <div className="flex items-center justify-center">
                          {getSignificanceIndicator(result.p_value).icon}
                        </div>
                      </td>
                      <td className="text-center p-2">{result.lag_period || 0}</td>
                      <td className="text-center p-2">
                        <Badge variant={getCorrelationCategory(result.correlation_coefficient) === 'no_correlation' ? 'outline' : 'default'}>
                          {getCorrelationCategory(result.correlation_coefficient).replace('_', ' ')}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredCorrelations.length > 20 && (
              <div className="mt-4 text-center text-sm text-gray-600">
                Showing 20 of {filteredCorrelations.length} correlations. Use export for full data.
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Correlation Matrix View Component
interface CorrelationMatrixViewProps {
  matrix: SignalCorrelationMatrix;
  selectedSignals: string[];
  onSignalSelect: (signals: string[]) => void;
  getCorrelationColor: (coefficient: number) => string;
  formatCorrelation: (coefficient: number) => string;
}

const CorrelationMatrixView: React.FC<CorrelationMatrixViewProps> = ({
  matrix,
  selectedSignals,
  onSignalSelect,
  getCorrelationColor,
  formatCorrelation
}) => {
  const displaySignals = selectedSignals.length > 0 ? selectedSignals : matrix.signals.slice(0, 10);
  
  const handleSignalToggle = (signal: string) => {
    const newSelection = selectedSignals.includes(signal)
      ? selectedSignals.filter(s => s !== signal)
      : [...selectedSignals, signal];
    onSignalSelect(newSelection);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Correlation Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Signal Selection */}
        <div className="mb-4 flex flex-wrap gap-2">
          {matrix.signals.map(signal => (
            <Badge
              key={signal}
              variant={selectedSignals.includes(signal) ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => handleSignalToggle(signal)}
            >
              {signal}
            </Badge>
          ))}
        </div>

        {/* Matrix Display */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-2"></th>
                {displaySignals.map(signal => (
                  <th key={signal} className="p-2 text-xs font-normal rotate-45">
                    {signal}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {displaySignals.map(signal1 => (
                <tr key={signal1}>
                  <td className="p-2 font-medium text-xs">{signal1}</td>
                  {displaySignals.map(signal2 => {
                    const correlation = matrix.correlations.find(
                      c => (c.signal1 === signal1 && c.signal2 === signal2) ||
                           (c.signal1 === signal2 && c.signal2 === signal1)
                    );
                    const value = correlation?.correlation_coefficient || 0;
                    
                    return (
                      <td 
                        key={signal2} 
                        className="p-2 text-center font-semibold"
                        style={{ 
                          color: getCorrelationColor(value),
                          backgroundColor: signal1 === signal2 ? '#f3f4f6' : 'transparent'
                        }}
                      >
                        {formatCorrelation(value)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

// Scatter Analysis View Component
interface ScatterAnalysisViewProps {
  correlations: SignalCorrelationResult[];
  getCorrelationColor: (coefficient: number) => string;
  formatCorrelation: (coefficient: number) => string;
  getSignificanceIndicator: (pValue: number) => { icon: React.ReactNode; color: string };
}

const ScatterAnalysisView: React.FC<ScatterAnalysisViewProps> = ({
  correlations,
  getCorrelationColor,
  formatCorrelation,
  getSignificanceIndicator
}) => {
  const scatterData = correlations.map(corr => ({
    x: Math.abs(corr.correlation_coefficient),
    y: -Math.log10(corr.p_value),
    correlation: corr.correlation_coefficient,
    signal1: corr.signal1,
    signal2: corr.signal2,
    pValue: corr.p_value
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScatterChart className="h-5 w-5" />
          Correlation vs Significance Scatter Plot
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-96">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsScatterChart>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="x"
                domain={[0, 1]}
                label={{ value: 'Correlation Strength', position: 'insideBottom', offset: -5 }}
              />
              <YAxis 
                dataKey="y"
                label={{ value: 'Significance (-log₁₀ p-value)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload[0]) {
                    const data = payload[0].payload as any;
                    return (
                      <div className="bg-white p-3 border rounded shadow-lg">
                        <p className="font-semibold">{data.signal1} ↔ {data.signal2}</p>
                        <p>Correlation: {formatCorrelation(data.correlation)}</p>
                        <p>P-Value: {data.pValue.toFixed(4)}</p>
                        <p>Significance: {data.y.toFixed(2)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter 
                data={scatterData} 
                fill="#8884d8"
                shape={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle 
                      cx={cx} 
                      cy={cy} 
                      r={6} 
                      fill={getCorrelationColor(payload.correlation)}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </RechartsScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          <p>• X-axis: Correlation strength (0 to 1)</p>
          <p>• Y-axis: Statistical significance (higher = more significant)</p>
          <p>• Points in upper-right indicate strong, significant correlations</p>
        </div>
      </CardContent>
    </Card>
  );
};

// Time Series Correlation View Component
interface TimeSeriesCorrelationViewProps {
  timeSeriesData: TimeSeriesCorrelation[];
  getCorrelationColor: (coefficient: number) => string;
}

const TimeSeriesCorrelationView: React.FC<TimeSeriesCorrelationViewProps> = ({
  timeSeriesData,
  getCorrelationColor
}) => {
  return (
    <div className="space-y-6">
      {timeSeriesData.map((series, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {series.signal1} ↔ {series.signal2}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-2">
              <p className="text-sm text-gray-600">Overall Correlation: {series.overall_correlation.toFixed(3)}</p>
              <p className="text-sm text-gray-600">Lag: {series.optimal_lag || 0} days</p>
              <p className="text-sm text-gray-600">Trend: {series.trend_direction || 'stable'}</p>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={series.data_points}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="signal1_value" 
                    stroke={getCorrelationColor(series.overall_correlation)}
                    strokeWidth={2}
                    name={series.signal1}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="signal2_value" 
                    stroke="#6b7280"
                    strokeWidth={2}
                    name={series.signal2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Cross-League Correlation View Component
interface CrossLeagueCorrelationViewProps {
  crossLeagueData: CrossLeagueCorrelation[];
  getCorrelationColor: (coefficient: number) => string;
}

const CrossLeagueCorrelationView: React.FC<CrossLeagueCorrelationViewProps> = ({
  crossLeagueData,
  getCorrelationColor
}) => {
  return (
    <div className="space-y-4">
      {crossLeagueData.map((cross, index) => (
        <Card key={index}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-semibold">{cross.source_league} ↔ {cross.target_league}</h4>
                <p className="text-sm text-gray-600">Signal: {cross.signal_type}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold" style={{ color: getCorrelationColor(cross.correlation_coefficient) }}>
                  {formatCorrelation(cross.correlation_coefficient)}
                </p>
                <p className="text-sm text-gray-600">Correlation</p>
              </div>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  { name: 'Correlation', value: Math.abs(cross.correlation_coefficient) },
                  { name: 'Significance', value: cross.significance_score }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 1]} />
                  <Tooltip />
                  <Bar dataKey="value" fill={getCorrelationColor(cross.correlation_coefficient)} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

// Helper function for formatting correlation values
const formatCorrelation = (coefficient: number): string => {
  return `${coefficient > 0 ? '+' : ''}${coefficient.toFixed(3)}`;
};

export default MarketSignalCorrelation;