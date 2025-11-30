// Phase 9: Market Integration Components

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Loader2, DollarSign, RefreshCw, AlertCircle, ExternalLink, Calculator, Target, Copy } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { CopyButton } from '@/components/common';
import { MarketIntegrationService } from '@/lib/phase9-api';
import type { MarketOdds, ValueBet, MarketOddsDisplayProps, ValueBetHighlightsProps } from '@/types/phase9';

// Market Odds Display Component
export const MarketOddsDisplay: React.FC<MarketOddsDisplayProps> = ({
  matchId,
  showValueBets = true,
  autoRefresh = true
}) => {
  const [odds, setOdds] = useState<MarketOdds[]>([]);
  const [valueBets, setValueBets] = useState<ValueBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const fetchOddsAndValueBets = useCallback(async () => {
    try {
      setError(null);

      // Fetch external odds first
      const oddsResult = await MarketIntegrationService.fetchExternalOdds(matchId);
      if (!oddsResult.success) {
        throw new Error(oddsResult.error);
      }

      // Get stored odds
      const storedOddsResult = await MarketIntegrationService.getMarketOdds(matchId);
      if (storedOddsResult.success && storedOddsResult.odds) {
        setOdds(storedOddsResult.odds);
        setLastUpdated(new Date());
      }

      // Calculate value bets if enabled
      if (showValueBets) {
        const valueBetsResult = await MarketIntegrationService.calculateValueBets(matchId);
        if (valueBetsResult.success && valueBetsResult.valueBets) {
          setValueBets(valueBetsResult.valueBets);
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch market data';
      setError(errorMessage);
      toast({
        title: 'Error fetching market data',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [matchId, showValueBets]);
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchOddsAndValueBets();
  };
  useEffect(() => {
    fetchOddsAndValueBets();
    if (autoRefresh) {
      const interval = setInterval(fetchOddsAndValueBets, 60000); // Refresh every minute
      return () => clearInterval(interval);
    }
  }, [matchId, showValueBets, autoRefresh, fetchOddsAndValueBets]);
  const formatOdds = (odds: number) => {
    return odds.toFixed(2);
  };
  const getOddsColor = (odds: number) => {
    if (odds < 1.5) return 'text-green-600 font-semibold';
    if (odds < 2.5) return 'text-blue-600';
    if (odds < 4.0) return 'text-yellow-600';
    return 'text-red-600';
  };
  const getBookmakerColor = (bookmaker: string) => {
    const colors: Record<string, string> = {
      'Bet365': 'bg-green-100 text-green-800 border-green-200',
      'William Hill': 'bg-blue-100 text-blue-800 border-blue-200',
      'Betfair': 'bg-purple-100 text-purple-800 border-purple-200',
      'Paddy Power': 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
    return colors[bookmaker] || 'bg-gray-100 text-gray-800 border-gray-200';
  };
  if (isLoading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Market Odds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Market Odds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4 w-full" variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </CardContent>
      </Card>;
  }
  if (odds.length === 0) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Market Odds
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No market odds available for this match.</p>
            <Button onClick={handleRefresh} className="mt-4" variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Fetch Odds
            </Button>
          </div>
        </CardContent>
      </Card>;
  }
  return <div className="space-y-6">
      {/* Market Odds Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Market Odds
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastUpdated && <span className="text-xs text-gray-500">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>}
              <Button onClick={handleRefresh} disabled={isRefreshing} size="sm" variant="outline">
                <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Bookmaker</th>
                  <th className="text-center p-2">1</th>
                  <th className="text-center p-2">X</th>
                  <th className="text-center p-2">2</th>
                  <th className="text-center p-2">O 2.5</th>
                  <th className="text-center p-2">U 2.5</th>
                  <th className="text-center p-2">BTTS Y</th>
                  <th className="text-center p-2">BTTS N</th>
                </tr>
              </thead>
              <tbody>
                {odds.map(odd => <tr key={odd.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <Badge className={getBookmakerColor(odd.bookmaker)}>
                        {odd.bookmaker}
                      </Badge>
                    </td>
                    <td className={`text-center p-2 ${getOddsColor(odd.home_win_odds)}`}>
                      {formatOdds(odd.home_win_odds)}
                    </td>
                    <td className={`text-center p-2 ${getOddsColor(odd.draw_odds)}`}>
                      {formatOdds(odd.draw_odds)}
                    </td>
                    <td className={`text-center p-2 ${getOddsColor(odd.away_win_odds)}`}>
                      {formatOdds(odd.away_win_odds)}
                    </td>
                    <td className={`text-center p-2 ${getOddsColor(odd.over_2_5_odds || 0)}`}>
                      {odd.over_2_5_odds ? formatOdds(odd.over_2_5_odds) : '-'}
                    </td>
                    <td className={`text-center p-2 ${getOddsColor(odd.under_2_5_odds || 0)}`}>
                      {odd.under_2_5_odds ? formatOdds(odd.under_2_5_odds) : '-'}
                    </td>
                    <td className={`text-center p-2 ${getOddsColor(odd.btts_yes_odds || 0)}`}>
                      {odd.btts_yes_odds ? formatOdds(odd.btts_yes_odds) : '-'}
                    </td>
                    <td className={`text-center p-2 ${getOddsColor(odd.btts_no_odds || 0)}`}>
                      {odd.btts_no_odds ? formatOdds(odd.btts_no_odds) : '-'}
                    </td>
                  </tr>)}
              </tbody>
            </table>
          </div>

          {/* API Source Info */}
          <div className="mt-4 text-xs text-gray-500">
            <p>Source: {odds[0]?.api_source || 'Unknown'}</p>
            <p>External odds are fetched every minute. Data may be delayed.</p>
          </div>
        </CardContent>
      </Card>

      {/* Value Bets Section */}
      {showValueBets && valueBets.length > 0 && <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Value Bets ({valueBets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {valueBets.map(valueBet => <ValueBetCard key={valueBet.id} valueBet={valueBet} />)}
            </div>
          </CardContent>
        </Card>}
    </div>;
};

// Value Bet Card Component
interface ValueBetCardProps {
  valueBet: ValueBet;
}
const ValueBetCard: React.FC<ValueBetCardProps> = ({
  valueBet
}) => {
  const getEVColor = (ev: number) => {
    if (ev > 0.15) return 'text-green-600';
    if (ev > 0.08) return 'text-yellow-600';
    return 'text-orange-600';
  };
  const getConfidenceBadgeVariant = (level: string) => {
    switch (level) {
      case 'high':
        return 'default';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };
  const formatBetType = (betType: string) => {
    return betType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };
  const kellyPercentage = (valueBet.kelly_fraction * 100).toFixed(1);
  return <div className="border rounded-lg p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant={getConfidenceBadgeVariant(valueBet.confidence_level)}>
            {valueBet.confidence_level.toUpperCase()}
          </Badge>
          <span className="font-semibold">{valueBet.bookmaker}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">{formatBetType(valueBet.bet_type)}</span>
          <span className={`font-bold ${getEVColor(valueBet.expected_value)}`}>
            +{(valueBet.expected_value * 100).toFixed(1)}% EV
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <span className="text-gray-600">Odds:</span>
          <div className="font-semibold">{valueBet.bookmaker_odds.toFixed(2)}</div>
        </div>
        <div>
          <span className="text-gray-600">Model Prob:</span>
          <div className="font-semibold">{(valueBet.model_probability * 100).toFixed(1)}%</div>
        </div>
        <div>
          <span className="text-gray-600">Implied Prob:</span>
          <div className="font-semibold">{(valueBet.implied_probability * 100).toFixed(1)}%</div>
        </div>
      </div>

      {/* Kelly Criterion */}
      <div className="pt-2 border-t">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Kelly Criterion:</span>
          <span className="font-semibold">{kellyPercentage}% of bankroll</span>
        </div>
        <Progress value={parseFloat(kellyPercentage)} className="mt-1 h-2" />
        <p className="text-xs text-gray-500 mt-1">
          Recommended bet size according to Kelly Criterion
        </p>
      </div>
    </div>;
};

// Value Bet Highlights Component
export const ValueBetHighlights: React.FC<ValueBetHighlightsProps> = ({
  maxResults = 10,
  minExpectedValue = 0.05,
  showKellyCalculator = true
}) => {
  const [valueBets, setValueBets] = useState<ValueBet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bankroll, setBankroll] = useState(1000); // Default bankroll for Kelly calculator
  const [showCalculator, setShowCalculator] = useState(false);
  const fetchValueBets = useCallback(async () => {
    try {
      setError(null);
      const result = await MarketIntegrationService.getValueBets(maxResults);
      if (result.success && result.valueBets) {
        // Filter by minimum expected value
        const filteredBets = result.valueBets.filter(bet => bet.expected_value >= minExpectedValue);
        setValueBets(filteredBets);
      } else {
        throw new Error(result.error || 'Failed to fetch value bets');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch value bets';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [maxResults, minExpectedValue]);
  useEffect(() => {
    fetchValueBets();
  }, [maxResults, minExpectedValue, fetchValueBets]);
  const calculateKellyBet = (kellyFraction: number) => {
    return (bankroll * kellyFraction).toFixed(2);
  };
  const getValueBetSummary = (bet: ValueBet) => {
    return `Value Bet Details
Bookmaker: ${bet.bookmaker}
Match: ${bet.match_id}
Bet Type: ${bet.bet_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
Odds: ${bet.odds.toFixed(2)}
Expected Value: ${(bet.expected_value * 100).toFixed(2)}%
Confidence: ${bet.confidence.toFixed(1)}%
Kelly Fraction: ${(bet.kelly_fraction * 100).toFixed(2)}%`;
  };
  const getTopValueBets = () => {
    return valueBets.slice(0, 5); // Top 5 for highlights
  };
  if (isLoading) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Value Bet Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>;
  }
  if (error) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Value Bet Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>;
  }
  if (valueBets.length === 0) {
    return <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Value Bet Highlights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No value bets found matching your criteria.</p>
            <p className="text-sm">Try lowering your minimum expected value threshold.</p>
          </div>
        </CardContent>
      </Card>;
  }
  const topBets = getTopValueBets();
  return <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Value Bet Highlights ({valueBets.length} found)
          </CardTitle>
          {showKellyCalculator && <Button onClick={() => setShowCalculator(!showCalculator)} size="sm" variant="outline">
              <Calculator className="mr-2 h-4 w-4" />
              Kelly Calculator
            </Button>}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top Value Bets */}
        <div className="space-y-3">
          <h4 className="font-semibold">Top Value Bets</h4>
          {topBets.map((valueBet, index) => <div key={valueBet.id} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold text-gray-400">#{index + 1}</span>
                <div>
                  <div className="font-semibold">{valueBet.bookmaker}</div>
                  <div className="text-sm text-gray-600">
                    {valueBet.bet_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">
                  +{(valueBet.expected_value * 100).toFixed(1)}% EV
                </div>
                <div className="text-sm text-gray-600">
                  {valueBet.bookmaker_odds.toFixed(2)} odds
                </div>
                {showCalculator && showCalculator && <div className="text-sm font-semibold text-blue-600">
                    ${calculateKellyBet(valueBet.kelly_fraction)} bet
                  </div>}
              </div>
              <CopyButton text={getValueBetSummary(valueBet)} size="sm" variant="ghost" successMessage="Value bet details copied">
                <Copy className="h-4 w-4" />
              </CopyButton>
            </div>)}
        </div>

        {/* Kelly Calculator */}
        {showKellyCalculator && showCalculator && <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
            <h4 className="font-semibold">Kelly Calculator</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Bankroll ($)</label>
                <input type="number" value={bankroll} onChange={e => setBankroll(parseFloat(e.target.value) || 0)} className="w-full mt-1 px-3 py-2 border rounded-md" min="0" step="100" />
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Bet size = Kelly % × Bankroll</p>
                <p>• Never bet more than 25% of bankroll</p>
                <p>• Consider fractional Kelly (50-75%)</p>
              </div>
            </div>
          </div>}

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 border rounded-lg bg-blue-50">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {(valueBets.reduce((sum, bet) => sum + bet.expected_value, 0) / valueBets.length * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Avg EV</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {valueBets.filter(bet => bet.confidence_level === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Confidence</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {(valueBets.reduce((sum, bet) => sum + bet.kelly_fraction, 0) / valueBets.length * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Avg Kelly</div>
          </div>
        </div>

        {/* View All Link */}
        <div className="text-center">
          <Button variant="outline" className="w-full">
            <ExternalLink className="mr-2 h-4 w-4" />
            View All {valueBets.length} Value Bets
          </Button>
        </div>
      </CardContent>
    </Card>;
};