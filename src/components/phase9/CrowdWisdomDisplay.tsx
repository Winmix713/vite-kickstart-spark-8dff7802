// Phase 9: Crowd Wisdom Display Component

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Users, AlertCircle, Copy } from 'lucide-react';
import { CopyButton } from '@/components/common';
import { CollaborativeIntelligenceService } from '@/lib/phase9-api';
import type { CrowdWisdomDisplayProps, CrowdWisdom, DivergenceAnalysis } from '@/types/phase9';
interface CrowdWisdomData {
  crowdWisdom?: CrowdWisdom;
  divergence?: DivergenceAnalysis;
  isLoading: boolean;
  error?: string;
}
export const CrowdWisdomDisplay: React.FC<CrowdWisdomDisplayProps> = ({
  matchId,
  showDivergence = true,
  refreshInterval = 30000 // 30 seconds
}) => {
  const [data, setData] = useState<CrowdWisdomData>({
    isLoading: true
  });
  const fetchData = useCallback(async () => {
    try {
      setData(prev => ({
        ...prev,
        isLoading: true,
        error: undefined
      }));
      const cwRes = await CollaborativeIntelligenceService.getCrowdWisdom(matchId);
      const divRes = showDivergence ? await CollaborativeIntelligenceService.analyzeDivergence(matchId) : {
        success: true
      };
      const crowdWisdom = cwRes.success ? cwRes.crowdWisdom as CrowdWisdom | null || undefined : undefined;
      const divergence = (divRes as {
        success: boolean;
        analysis?: DivergenceAnalysis;
      }).success ? (divRes as {
        analysis?: DivergenceAnalysis;
      }).analysis : undefined;
      setData({
        crowdWisdom,
        divergence,
        isLoading: false,
        error: cwRes.success ? undefined : cwRes.error || 'Failed to fetch crowd wisdom'
      });
    } catch (error) {
      setData({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch crowd wisdom'
      });
    }
  }, [matchId, showDivergence]);
  useEffect(() => {
    fetchData();
    if (refreshInterval > 0) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, refreshInterval]);
  const getCrowdWisdomSummary = () => {
    if (!data.crowdWisdom) return '';
    const cw = data.crowdWisdom;
    return `Crowd Wisdom Summary for Match ${matchId}
Total Predictions: ${cw.total_predictions}
Consensus: ${cw.consensus_prediction.replace('_', ' ').toUpperCase()}
Consensus Confidence: ${cw.consensus_confidence.toFixed(1)}%
Average Confidence: ${cw.average_confidence.toFixed(1)}%

Distribution:
- Home Win: ${cw.home_win_predictions} (${(cw.home_win_predictions / cw.total_predictions * 100).toFixed(1)}%)
- Draw: ${cw.draw_predictions} (${(cw.draw_predictions / cw.total_predictions * 100).toFixed(1)}%)
- Away Win: ${cw.away_win_predictions} (${(cw.away_win_predictions / cw.total_predictions * 100).toFixed(1)}%)`;
  };
  const getDivergenceSummary = () => {
    if (!data.divergence) return '';
    const d = data.divergence;
    return `Model vs Crowd Analysis
Model Prediction: ${d.modelPrediction.replace('_', ' ').toUpperCase()} (${d.modelConfidence.toFixed(1)}% confidence)
Crowd Consensus: ${d.crowdConsensus.replace('_', ' ').toUpperCase()} (${d.crowdConfidence.toFixed(1)}% confidence)
Divergence: ${d.divergence.toFixed(1)}%`;
  };
  const getOutcomeColor = (outcome: string) => {
    switch (outcome) {
      case 'home_win':
        return 'bg-blue-100 text-blue-800';
      case 'draw':
        return 'bg-gray-100 text-gray-800';
      case 'away_win':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  const getDivergenceColor = (divergence: number) => {
    if (divergence >= 20) return 'text-red-600';
    if (divergence >= 10) return 'text-yellow-600';
    return 'text-green-600';
  };
  if (data.isLoading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Crowd Wisdom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>;
  }
  if (data.error) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Crowd Wisdom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{data.error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>;
  }
  if (!data.crowdWisdom || data.crowdWisdom.total_predictions === 0) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Crowd Wisdom
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No predictions yet for this match.</p>
            <p className="text-sm">Be the first to share your prediction!</p>
          </div>
        </CardContent>
      </Card>;
  }
  return <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Crowd Wisdom ({data.crowdWisdom.total_predictions} predictions)
          <CopyButton text={getCrowdWisdomSummary()} size="sm" variant="ghost" successMessage="Crowd wisdom summary copied">
            <Copy className="h-4 w-4" />
          </CopyButton>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Consensus Prediction */}
        {data.crowdWisdom.consensus_prediction && <div className="space-y-2">
            <h4 className="font-semibold">Consensus Prediction</h4>
            <div className="flex items-center gap-2">
              <Badge className={getOutcomeColor(data.crowdWisdom.consensus_prediction)}>
                {data.crowdWisdom.consensus_prediction.replace('_', ' ').toUpperCase()}
              </Badge>
              <span className="text-sm text-gray-600">
                {data.crowdWisdom.consensus_confidence.toFixed(1)}% confidence
              </span>
            </div>
          </div>}

        {/* Prediction Distribution */}
        <div className="space-y-2">
          <h4 className="font-semibold">Prediction Distribution</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Home Win</span>
              <span className="font-semibold">{data.crowdWisdom.home_win_predictions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{
              width: `${data.crowdWisdom.home_win_predictions / data.crowdWisdom.total_predictions * 100}%`
            }} />
            </div>

            <div className="flex items-center justify-between">
              <span>Draw</span>
              <span className="font-semibold">{data.crowdWisdom.draw_predictions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gray-600 h-2 rounded-full" style={{
              width: `${data.crowdWisdom.draw_predictions / data.crowdWisdom.total_predictions * 100}%`
            }} />
            </div>

            <div className="flex items-center justify-between">
              <span>Away Win</span>
              <span className="font-semibold">{data.crowdWisdom.away_win_predictions}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full" style={{
              width: `${data.crowdWisdom.away_win_predictions / data.crowdWisdom.total_predictions * 100}%`
            }} />
            </div>
          </div>
        </div>

        {/* Average Confidence */}
        <div className="space-y-2">
          <h4 className="font-semibold">Average Confidence</h4>
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{
              width: `${data.crowdWisdom.average_confidence}%`
            }} />
            </div>
            <span className="text-sm font-semibold">
              {data.crowdWisdom.average_confidence.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Divergence Analysis */}
        {showDivergence && data.divergence && <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Model vs Crowd Analysis</h4>
              <CopyButton text={getDivergenceSummary()} size="sm" variant="ghost" successMessage="Divergence analysis copied">
                <Copy className="h-4 w-4" />
              </CopyButton>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Model Prediction:</span>
                <div className="font-semibold">
                  {data.divergence.modelPrediction.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-gray-600">
                  {data.divergence.modelConfidence.toFixed(1)}% confidence
                </div>
              </div>
              <div>
                <span className="text-gray-600">Crowd Consensus:</span>
                <div className="font-semibold">
                  {data.divergence.crowdConsensus.replace('_', ' ').toUpperCase()}
                </div>
                <div className="text-gray-600">
                  {data.divergence.crowdConfidence.toFixed(1)}% confidence
                </div>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Divergence:</span>
                <span className={`text-sm font-bold ${getDivergenceColor(data.divergence.divergence)}`}>
                  {data.divergence.divergence.toFixed(1)}%
                </span>
              </div>
              <Badge variant={data.divergence.interpretation === 'high' ? 'destructive' : data.divergence.interpretation === 'medium' ? 'default' : 'secondary'} className="mt-1">
                {data.divergence.interpretation.toUpperCase()} Divergence
              </Badge>
              <p className="text-xs text-gray-600 mt-2">
                {data.divergence.recommendation}
              </p>
            </div>
          </div>}

        {/* Last Updated */}
        <div className="text-xs text-gray-500 text-right">
          Last updated: {new Date(data.crowdWisdom.last_calculated_at).toLocaleString()}
        </div>
      </CardContent>
    </Card>;
};