// Phase 9: Temporal Decay Components

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Clock, RefreshCw, AlertTriangle, CheckCircle, TrendingDown, Activity, Calendar } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { TemporalDecayService } from '@/lib/phase9-api';
import type { InformationFreshness, FreshnessIndicatorProps, TemporalDecayConfig } from '@/types/phase9';
import { supabase } from '@/integrations/supabase/client';

// Freshness Indicator Component
export const FreshnessIndicator: React.FC<FreshnessIndicatorProps> = ({
  tableName,
  recordId,
  dataType,
  showDetails = false
}) => {
  const [freshness, setFreshness] = useState<InformationFreshness | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fetchFreshness = useCallback(async () => {
    try {
      setError(null);
      const result = await TemporalDecayService.calculateFreshnessScore(tableName, recordId);
      if (result.success) {
        // Get full freshness record
        const {
          data,
          error: fetchError
        } = await supabase.from('information_freshness').select('*').eq('table_name', tableName).eq('record_id', recordId).single();
        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }
        setFreshness(data as InformationFreshness);
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch freshness';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [tableName, recordId]);
  useEffect(() => {
    fetchFreshness();
  }, [tableName, recordId, dataType, fetchFreshness]);
  const getFreshnessColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.5) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getFreshnessBadgeVariant = (score: number, isStale: boolean) => {
    if (isStale) return 'destructive';
    if (score >= 0.8) return 'default';
    if (score >= 0.5) return 'secondary';
    return 'outline';
  };
  const getFreshnessLabel = (score: number, isStale: boolean) => {
    if (isStale) return 'STALE';
    if (score >= 0.8) return 'FRESH';
    if (score >= 0.5) return 'AGING';
    return 'STALE';
  };
  const getDaysSinceUpdate = (lastUpdated: string) => {
    const now = new Date();
    const updated = new Date(lastUpdated);
    const diffTime = Math.abs(now.getTime() - updated.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };
  if (isLoading) {
    return <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 animate-pulse" />
        <span className="text-sm text-gray-500">Loading...</span>
      </div>;
  }
  if (error || !freshness) {
    return <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-red-500" />
        <span className="text-sm text-red-500">Error</span>
      </div>;
  }
  const daysSinceUpdate = getDaysSinceUpdate(freshness.last_updated);
  const freshnessPercentage = freshness.freshness_score * 100;
  return <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Clock className={`h-4 w-4 ${getFreshnessColor(freshness.freshness_score)}`} />
        <Badge variant={getFreshnessBadgeVariant(freshness.freshness_score, freshness.is_stale)}>
          {getFreshnessLabel(freshness.freshness_score, freshness.is_stale)}
        </Badge>
        <span className={`text-sm font-medium ${getFreshnessColor(freshness.freshness_score)}`}>
          {freshnessPercentage.toFixed(0)}%
        </span>
      </div>
      
      {showDetails && <div className="text-xs text-gray-500">
          <div>Updated {daysSinceUpdate} days ago</div>
          <div>Decay rate: {(freshness.decay_rate * 100).toFixed(1)}%/day</div>
        </div>}
    </div>;
};

// Temporal Decay Dashboard Component
interface TemporalDecayDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}
export const TemporalDecayDashboard: React.FC<TemporalDecayDashboardProps> = ({
  autoRefresh = true,
  refreshInterval = 60000 // 1 minute
}) => {
  const [staleRecords, setStaleRecords] = useState<InformationFreshness[]>([]);
  const [allRecords, setAllRecords] = useState<InformationFreshness[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const fetchFreshnessData = async () => {
    try {
      setError(null);

      // Get all freshness records
      const {
        data,
        error: fetchError
      } = await supabase.from('information_freshness').select('*').order('freshness_score', {
        ascending: true
      });
      if (fetchError) throw fetchError;
      const records = data as InformationFreshness[];
      const stale = records.filter(record => record.is_stale);
      setAllRecords(records);
      setStaleRecords(stale);
      setLastRefresh(new Date());
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch freshness data';
      setError(errorMessage);
      toast({
        title: 'Error fetching freshness data',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };
  const handleRefreshStaleData = async () => {
    setIsRefreshing(true);
    try {
      const result = await TemporalDecayService.checkAndRefreshStaleData();
      if (result.success) {
        toast({
          title: 'Stale data refreshed',
          description: `Refreshed ${result.refreshedCount} records`
        });

        // Refetch data to update the UI
        await fetchFreshnessData();
      } else {
        throw new Error(result.error);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh stale data';
      toast({
        title: 'Error refreshing stale data',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsRefreshing(false);
    }
  };
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchFreshnessData();
  };
  useEffect(() => {
    fetchFreshnessData();
    if (autoRefresh) {
      const interval = setInterval(fetchFreshnessData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);
  const getDataTypeStats = () => {
    const stats: Record<string, {
      total: number;
      stale: number;
      avgFreshness: number;
    }> = {};
    allRecords.forEach(record => {
      if (!stats[record.data_type]) {
        stats[record.data_type] = {
          total: 0,
          stale: 0,
          avgFreshness: 0
        };
      }
      stats[record.data_type].total++;
      if (record.is_stale) stats[record.data_type].stale++;
      stats[record.data_type].avgFreshness += record.freshness_score;
    });

    // Calculate averages
    Object.keys(stats).forEach(dataType => {
      stats[dataType].avgFreshness = stats[dataType].avgFreshness / stats[dataType].total;
    });
    return stats;
  };
  const getOverallHealth = () => {
    if (allRecords.length === 0) return 0;
    const totalFreshness = allRecords.reduce((sum, record) => sum + record.freshness_score, 0);
    return totalFreshness / allRecords.length * 100;
  };
  const getHealthColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getHealthLabel = (percentage: number) => {
    if (percentage >= 80) return 'EXCELLENT';
    if (percentage >= 60) return 'GOOD';
    if (percentage >= 40) return 'FAIR';
    return 'POOR';
  };
  if (isLoading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Temporal Decay Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Temporal Decay Monitor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4 w-full" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>;
  }
  const overallHealth = getOverallHealth();
  const dataTypeStats = getDataTypeStats();
  return <div className="space-y-6">
      {/* Overall Health Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Data Freshness Health
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastRefresh && <span className="text-xs text-gray-500">
                  Updated: {lastRefresh.toLocaleTimeString()}
                </span>}
              <Button onClick={handleRefresh} disabled={isRefreshing} size="sm" variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className={`text-4xl font-bold ${getHealthColor(overallHealth)}`}>
              {overallHealth.toFixed(1)}%
            </div>
            <Badge variant={overallHealth >= 80 ? 'default' : overallHealth >= 60 ? 'secondary' : 'destructive'} className="text-lg px-3 py-1">
              {getHealthLabel(overallHealth)}
            </Badge>
            <Progress value={overallHealth} className="h-3" />
            <div className="text-sm text-gray-600">
              {allRecords.length} records tracked • {staleRecords.length} stale
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Type Statistics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Freshness by Data Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(dataTypeStats).map(([dataType, stats]) => <div key={dataType} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold capitalize">{dataType.replace('_', ' ')}</h4>
                  {stats.stale > 0 ? <AlertTriangle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-green-500" />}
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Total:</span>
                    <span className="font-semibold">{stats.total}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Stale:</span>
                    <span className={`font-semibold ${stats.stale > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {stats.stale}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Avg Freshness:</span>
                    <span className={`font-semibold ${getHealthColor(stats.avgFreshness * 100)}`}>
                      {(stats.avgFreshness * 100).toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={stats.avgFreshness * 100} className="h-2" />
                </div>
              </div>)}
          </div>
        </CardContent>
      </Card>

      {/* Stale Records Alert */}
      {staleRecords.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Stale Records ({staleRecords.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {staleRecords.length} records are stale and may need refreshing. 
                Stale data can affect prediction accuracy.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              {staleRecords.slice(0, 5).map(record => <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <div className="font-semibold">{record.table_name}.{record.record_id}</div>
                    <div className="text-sm text-gray-600">
                      {record.data_type} • {record.freshness_score.toFixed(2)} freshness
                    </div>
                  </div>
                  <Badge variant="destructive">
                    {getDaysSinceUpdate(record.last_updated)} days old
                  </Badge>
                </div>)}
              {staleRecords.length > 5 && <div className="text-center text-sm text-gray-500">
                  ... and {staleRecords.length - 5} more stale records
                </div>}
            </div>

            <Button onClick={handleRefreshStaleData} disabled={isRefreshing} className="w-full">
              {isRefreshing ? <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Refreshing...
                </> : <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh All Stale Data
                </>}
            </Button>
          </CardContent>
        </Card>}

      {/* Freshness Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Decay Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Decay Rates:</strong></p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Match data: 5% per day (slow decay)</li>
              <li>Team statistics: 10% per day (moderate decay)</li>
              <li>Pattern data: 15% per day (moderate decay)</li>
              <li>Odds data: 50% per day (fast decay)</li>
              <li>User predictions: 10% per day (moderate decay)</li>
            </ul>
            <p className="mt-3">
              <strong>Formula:</strong> Freshness = e^(-decay_rate × days_elapsed)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>;
};

// Helper function to get days since update
const getDaysSinceUpdate = (lastUpdated: string): number => {
  const now = new Date();
  const updated = new Date(lastUpdated);
  const diffTime = Math.abs(now.getTime() - updated.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};