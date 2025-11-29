// Phase 9 API Service - Market Correlation Analysis
// Provides advanced correlation analysis between market signals, odds movements, and prediction accuracy

import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

// Types for market correlation analysis
export interface MarketSignal {
  id: string;
  signal_type: 'odds_movement' | 'volume_change' | 'social_sentiment' | 'prediction_accuracy' | 'weather_impact' | 'team_news';
  timestamp: string;
  value: number;
  metadata: Record<string, unknown>;
  match_id?: string;
  league_id?: string;
  bookmaker?: string;
  source: string;
}

export interface SignalCorrelationResult {
  signal1: string;
  signal2: string;
  correlation_coefficient: number;
  p_value: number;
  sample_size: number;
  confidence_interval: [number, number];
  method: 'pearson' | 'spearman' | 'kendall';
  lag_period?: number;
  significance_level: number;
  is_significant: boolean;
}

export interface SignalCorrelationMatrix {
  signals: string[];
  correlations: SignalCorrelationResult[];
  metadata: {
    total_signals: number;
    analysis_period: {
      start: string;
      end: string;
    };
    method: string;
    confidence_level: number;
  };
}

export interface TimeSeriesCorrelation {
  signal1: string;
  signal2: string;
  overall_correlation: number;
  optimal_lag: number;
  trend_direction: 'increasing' | 'decreasing' | 'stable';
  data_points: Array<{
    date: string;
    signal1_value: number;
    signal2_value: number;
    correlation: number;
  }>;
  significance_tests: {
    augmented_dickey_fuller: number;
    phillips_perron: number;
    kpss: number;
  };
}

export interface CrossLeagueCorrelation {
  source_league: string;
  target_league: string;
  signal_type: string;
  correlation_coefficient: number;
  significance_score: number;
  sample_size: number;
  time_lag: number;
  confidence_level: number;
}

export interface MarketCorrelationAnalysisOptions {
  method?: 'pearson' | 'spearman' | 'kendall';
  confidenceLevel?: number;
  minPeriods?: number;
  includeLagCorrelations?: boolean;
  lagPeriods?: number[];
  seasonalAdjustment?: boolean;
  outlierRemoval?: boolean;
  normalizeData?: boolean;
}

export interface MarketSignalsFetchOptions {
  leagueId?: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
  signalTypes?: string[];
  minConfidence?: number;
  includeInactive?: boolean;
}

export interface ValueBetOpportunity {
  id: string;
  match_id: string;
  bookmaker: string;
  bet_type: string;
  odds: number;
  model_probability: number;
  implied_probability: number;
  expected_value: number;
  confidence_level: 'high' | 'medium' | 'low';
  kelly_fraction: number;
  detection_timestamp: string;
  market_signals: string[];
  correlation_strength: number;
}

export interface MarketArbitrageOpportunity {
  id: string;
  match_id: string;
  outcome: string;
  bookmaker_1: string;
  odds_1: number;
  bookmaker_2: string;
  odds_2: number;
  arbitrage_percentage: number;
  total_investment: number;
  profit_potential: number;
  confidence_score: number;
  detection_timestamp: string;
  market_inefficiency_score: number;
}

class MarketCorrelationService {
  private readonly tableName = 'market_signals';
  private readonly correlationCache = new Map<string, unknown>();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Fetch market signals from database and external sources
  async fetchMarketSignals(options: MarketSignalsFetchOptions = {}): Promise<{
    success: boolean;
    signals?: MarketSignal[];
    error?: string;
  }> {
    try {
      const {
        leagueId = 'all',
        timeRange = '30d',
        signalTypes = ['odds_movement', 'volume_change', 'social_sentiment', 'prediction_accuracy'],
        minConfidence = 0.7,
        includeInactive = false
      } = options;

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      switch (timeRange) {
        case '7d':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '30d':
          startDate.setDate(startDate.getDate() - 30);
          break;
        case '90d':
          startDate.setDate(startDate.getDate() - 90);
          break;
        case '1y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Build query
      let query = supabase
        .from(this.tableName)
        .select('*')
        .in('signal_type', signalTypes)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

      // Apply filters
      if (leagueId !== 'all') {
        query = query.eq('league_id', leagueId);
      }

      if (!includeInactive) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      // Transform data to MarketSignal format
      const signals: MarketSignal[] = (data || []).map(row => ({
        id: row.id,
        signal_type: row.signal_type,
        timestamp: row.timestamp,
        value: row.value,
        metadata: row.metadata || {},
        match_id: row.match_id,
        league_id: row.league_id,
        bookmaker: row.bookmaker,
        source: row.source || 'database'
      }));

      // Fetch external signals if needed
      const externalSignals = await this.fetchExternalSignals(options);
      signals.push(...externalSignals);

      logger.info('Fetched market signals', { 
        count: signals.length, 
        leagueId, 
        timeRange,
        signalTypes 
      }, 'MarketCorrelationService');

      return { success: true, signals };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to fetch market signals', error, { options }, 'MarketCorrelationService');
      return { success: false, error: errorMessage };
    }
  }

  // Calculate correlation matrix between all signal pairs
  async calculateCorrelationMatrix(
    signals: MarketSignal[],
    options: MarketCorrelationAnalysisOptions = {}
  ): Promise<{
    success: boolean;
    matrix?: SignalCorrelationMatrix;
    error?: string;
  }> {
    try {
      const {
        method = 'pearson',
        confidenceLevel = 0.95,
        minPeriods = 10,
        includeLagCorrelations = true,
        lagPeriods = [1, 3, 7, 14],
        seasonalAdjustment = false,
        outlierRemoval = true,
        normalizeData = true
      } = options;

      // Group signals by type
      const signalGroups = this.groupSignalsByType(signals);
      const signalTypes = Object.keys(signalGroups);

      if (signalTypes.length < 2) {
        throw new Error('At least two different signal types required for correlation analysis');
      }

      // Calculate correlations for all pairs
      const correlations: SignalCorrelationResult[] = [];

      for (let i = 0; i < signalTypes.length; i++) {
        for (let j = i + 1; j < signalTypes.length; j++) {
          const signal1Type = signalTypes[i];
          const signal2Type = signalTypes[j];

          // Align signals by timestamp
          const alignedSignals = this.alignSignalsByTime(
            signalGroups[signal1Type],
            signalGroups[signal2Type]
          );

          if (alignedSignals.length < minPeriods) {
            logger.warn('Insufficient data for correlation calculation', {
              signal1: signal1Type,
              signal2: signal2Type,
              sampleSize: alignedSignals.length,
              minRequired: minPeriods
            }, 'MarketCorrelationService');
            continue;
          }

          // Apply preprocessing
          let processedSignals = alignedSignals;
          if (outlierRemoval) {
            processedSignals = this.removeOutliers(processedSignals);
          }
          if (normalizeData) {
            processedSignals = this.normalizeSignalData(processedSignals);
          }

          // Calculate correlation
          const correlation = this.calculateCorrelation(
            processedSignals.map(s => s.value1),
            processedSignals.map(s => s.value2),
            method
          );

          // Calculate p-value and confidence interval
          const { pValue, confidenceInterval } = this.calculateSignificance(
            correlation,
            processedSignals.length,
            confidenceLevel
          );

          const result: SignalCorrelationResult = {
            signal1: signal1Type,
            signal2: signal2Type,
            correlation_coefficient: correlation,
            p_value: pValue,
            sample_size: processedSignals.length,
            confidence_interval: confidenceInterval,
            method,
            significance_level: confidenceLevel,
            is_significant: pValue < (1 - confidenceLevel)
          };

          correlations.push(result);

          // Calculate lag correlations if enabled
          if (includeLagCorrelations) {
            for (const lagPeriod of lagPeriods) {
              const laggedSignals = this.applyLag(processedSignals, lagPeriod);
              if (laggedSignals.length >= minPeriods) {
                const laggedCorrelation = this.calculateCorrelation(
                  laggedSignals.map(s => s.value1),
                  laggedSignals.map(s => s.value2),
                  method
                );

                const { pValue: laggedPValue } = this.calculateSignificance(
                  laggedCorrelation,
                  laggedSignals.length,
                  confidenceLevel
                );

                correlations.push({
                  ...result,
                  correlation_coefficient: laggedCorrelation,
                  p_value: laggedPValue,
                  lag_period: lagPeriod,
                  is_significant: laggedPValue < (1 - confidenceLevel)
                });
              }
            }
          }
        }
      }

      // Create correlation matrix
      const matrix: SignalCorrelationMatrix = {
        signals: signalTypes,
        correlations,
        metadata: {
          total_signals: signals.length,
          analysis_period: {
            start: signals.length > 0 ? signals[0].timestamp : new Date().toISOString(),
            end: signals.length > 0 ? signals[signals.length - 1].timestamp : new Date().toISOString()
          },
          method,
          confidence_level: confidenceLevel
        }
      };

      logger.info('Correlation matrix calculated', {
        signalTypes: signalTypes.length,
        correlations: correlations.length,
        method,
        confidenceLevel
      }, 'MarketCorrelationService');

      return { success: true, matrix };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to calculate correlation matrix', error, { options }, 'MarketCorrelationService');
      return { success: false, error: errorMessage };
    }
  }

  // Analyze time series correlations
  async analyzeTimeSeriesCorrelation(
    signals: MarketSignal[],
    options: {
      windowSize?: number;
      stepSize?: number;
      seasonalAdjustment?: boolean;
    } = {}
  ): Promise<{
    success: boolean;
    timeSeriesData?: TimeSeriesCorrelation[];
    error?: string;
  }> {
    try {
      const {
        windowSize = 30,
        stepSize = 7,
        seasonalAdjustment = false
      } = options;

      const signalGroups = this.groupSignalsByType(signals);
      const signalTypes = Object.keys(signalGroups);

      const timeSeriesData: TimeSeriesCorrelation[] = [];

      for (let i = 0; i < signalTypes.length; i++) {
        for (let j = i + 1; j < signalTypes.length; j++) {
          const signal1Type = signalTypes[i];
          const signal2Type = signalTypes[j];

          const alignedSignals = this.alignSignalsByTime(
            signalGroups[signal1Type],
            signalGroups[signal2Type]
          );

          if (alignedSignals.length < windowSize * 2) {
            continue;
          }

          // Calculate rolling correlations
          const dataPoints: TimeSeriesCorrelation['data_points'] = [];
          let totalCorrelation = 0;
          let validWindows = 0;

          for (let start = 0; start <= alignedSignals.length - windowSize; start += stepSize) {
            const window = alignedSignals.slice(start, start + windowSize);
            const correlation = this.calculateCorrelation(
              window.map(s => s.value1),
              window.map(s => s.value2)
            );

            const windowDate = window[Math.floor(windowSize / 2)].timestamp;
            
            dataPoints.push({
              date: windowDate,
              signal1_value: window[Math.floor(windowSize / 2)].value1,
              signal2_value: window[Math.floor(windowSize / 2)].value2,
              correlation
            });

            if (!isNaN(correlation)) {
              totalCorrelation += Math.abs(correlation);
              validWindows++;
            }
          }

          // Calculate trend direction
          const correlations = dataPoints.map(d => d.correlation).filter(c => !isNaN(c));
          const trendDirection = this.calculateTrendDirection(correlations);

          // Find optimal lag
          const optimalLag = this.findOptimalLag(alignedSignals);

          // Perform significance tests
          const significanceTests = this.performStationarityTests(correlations);

          const timeSeriesCorrelation: TimeSeriesCorrelation = {
            signal1: signal1Type,
            signal2: signal2Type,
            overall_correlation: validWindows > 0 ? totalCorrelation / validWindows : 0,
            optimal_lag: optimalLag,
            trend_direction: trendDirection,
            data_points: dataPoints,
            significance_tests: significanceTests
          };

          timeSeriesData.push(timeSeriesCorrelation);
        }
      }

      logger.info('Time series correlation analysis completed', {
        signalPairs: timeSeriesData.length,
        windowSize,
        stepSize
      }, 'MarketCorrelationService');

      return { success: true, timeSeriesData };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to analyze time series correlations', error, { options }, 'MarketCorrelationService');
      return { success: false, error: errorMessage };
    }
  }

  // Analyze cross-league correlations
  async analyzeCrossLeagueCorrelation(
    sourceLeagueId: string,
    signals: MarketSignal[]
  ): Promise<{
    success: boolean;
    crossLeagueData?: CrossLeagueCorrelation[];
    error?: string;
  }> {
    try {
      // Get signals from other leagues
      const { success: otherLeaguesSuccess, signals: otherLeagueSignals } = 
        await this.fetchMarketSignals({
          timeRange: '90d',
          signalTypes: ['odds_movement', 'volume_change']
        });

      if (!otherLeaguesSuccess || !otherLeagueSignals) {
        throw new Error('Failed to fetch signals from other leagues');
      }

      // Group by league
      const leagueGroups = this.groupSignalsByLeague(otherLeagueSignals);
      const sourceLeagueSignals = leagueGroups[sourceLeagueId] || [];
      
      const crossLeagueData: CrossLeagueCorrelation[] = [];

      for (const [targetLeagueId, targetSignals] of Object.entries(leagueGroups)) {
        if (targetLeagueId === sourceLeagueId) continue;

        // Group by signal type
        const sourceSignalGroups = this.groupSignalsByType(sourceLeagueSignals);
        const targetSignalGroups = this.groupSignalsByType(targetSignals);

        for (const signalType of Object.keys(sourceSignalGroups)) {
          if (!targetSignalGroups[signalType]) continue;

          const alignedSignals = this.alignSignalsByTime(
            sourceSignalGroups[signalType],
            targetSignalGroups[signalType]
          );

          if (alignedSignals.length < 20) continue;

          const correlation = this.calculateCorrelation(
            alignedSignals.map(s => s.value1),
            alignedSignals.map(s => s.value2)
          );

          const { pValue } = this.calculateSignificance(correlation, alignedSignals.length);

          // Calculate time lag
          const optimalLag = this.findOptimalLag(alignedSignals);

          // Calculate market inefficiency score
          const inefficiencyScore = Math.abs(correlation) * (1 - pValue);

          const crossLeagueCorrelation: CrossLeagueCorrelation = {
            source_league: sourceLeagueId,
            target_league: targetLeagueId,
            signal_type: signalType,
            correlation_coefficient: correlation,
            significance_score: 1 - pValue,
            sample_size: alignedSignals.length,
            time_lag: optimalLag,
            confidence_level: 0.95
          };

          crossLeagueData.push(crossLeagueCorrelation);
        }
      }

      logger.info('Cross-league correlation analysis completed', {
        sourceLeague: sourceLeagueId,
        correlations: crossLeagueData.length
      }, 'MarketCorrelationService');

      return { success: true, crossLeagueData };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to analyze cross-league correlations', error, { sourceLeagueId }, 'MarketCorrelationService');
      return { success: false, error: errorMessage };
    }
  }

  // Identify value bet opportunities based on correlation analysis
  async identifyValueBetOpportunities(
    correlations: SignalCorrelationResult[],
    minExpectedValue: number = 0.05
  ): Promise<{
    success: boolean;
    opportunities?: ValueBetOpportunity[];
    error?: string;
  }> {
    try {
      const opportunities: ValueBetOpportunity[] = [];

      // Get current odds and predictions
      const { data: matches } = await supabase
        .from('matches')
        .select(`
          id,
          home_team,
          away_team,
          league_id,
          match_date,
          predictions!inner(
            model_id,
            predicted_outcome,
            confidence,
            created_at
          ),
          market_odds!inner(
            bookmaker,
            home_win_odds,
            draw_odds,
            away_win_odds,
            over_2_5_odds,
            under_2_5_odds,
            btts_yes_odds,
            btts_no_odds,
            updated_at
          )
        `)
        .eq('status', 'upcoming')
        .gte('match_date', new Date().toISOString())
        .order('match_date', { ascending: true })
        .limit(50);

      if (!matches) {
        return { success: true, opportunities: [] };
      }

      for (const match of matches) {
        const { predictions, market_odds } = match;

        for (const prediction of predictions) {
          for (const odds of market_odds) {
            // Calculate expected value for each outcome
            const outcomes = [
              { type: 'home_win', modelProb: this.getOutcomeProbability(prediction, 'home_win'), odds: odds.home_win_odds },
              { type: 'draw', modelProb: this.getOutcomeProbability(prediction, 'draw'), odds: odds.draw_odds },
              { type: 'away_win', modelProb: this.getOutcomeProbability(prediction, 'away_win'), odds: odds.away_win_odds },
              { type: 'over_2_5', modelProb: this.getOutcomeProbability(prediction, 'over_2_5'), odds: odds.over_2_5_odds },
              { type: 'under_2_5', modelProb: this.getOutcomeProbability(prediction, 'under_2_5'), odds: odds.under_2_5_odds },
              { type: 'btts_yes', modelProb: this.getOutcomeProbability(prediction, 'btts_yes'), odds: odds.btts_yes_odds },
              { type: 'btts_no', modelProb: this.getOutcomeProbability(prediction, 'btts_no'), odds: odds.btts_no_odds }
            ];

            for (const outcome of outcomes) {
              if (!outcome.modelProb || !outcome.odds) continue;

              const impliedProb = 1 / outcome.odds;
              const expectedValue = (outcome.modelProb * outcome.odds) - 1;

              if (expectedValue >= minExpectedValue) {
                // Find related correlations
                const relatedCorrelations = correlations.filter(c => 
                  c.signal1.includes('odds') || c.signal2.includes('odds') ||
                  c.signal1.includes('prediction') || c.signal2.includes('prediction')
                );

                const avgCorrelationStrength = relatedCorrelations.length > 0
                  ? relatedCorrelations.reduce((sum, c) => sum + Math.abs(c.correlation_coefficient), 0) / relatedCorrelations.length
                  : 0;

                // Calculate Kelly fraction
                const kellyFraction = this.calculateKellyFraction(expectedValue, outcome.modelProb);

                // Determine confidence level
                const confidenceLevel = this.getConfidenceLevel(
                  prediction.confidence,
                  avgCorrelationStrength,
                  expectedValue
                );

                const opportunity: ValueBetOpportunity = {
                  id: `${match.id}-${odds.bookmaker}-${outcome.type}`,
                  match_id: match.id,
                  bookmaker: odds.bookmaker,
                  bet_type: outcome.type,
                  odds: outcome.odds,
                  model_probability: outcome.modelProb,
                  implied_probability: impliedProb,
                  expected_value: expectedValue,
                  confidence_level: confidenceLevel,
                  kelly_fraction: kellyFraction,
                  detection_timestamp: new Date().toISOString(),
                  market_signals: relatedCorrelations.map(c => `${c.signal1}↔${c.signal2}`),
                  correlation_strength: avgCorrelationStrength
                };

                opportunities.push(opportunity);
              }
            }
          }
        }
      }

      // Sort by expected value
      opportunities.sort((a, b) => b.expected_value - a.expected_value);

      logger.info('Value bet opportunities identified', {
        count: opportunities.length,
        minExpectedValue
      }, 'MarketCorrelationService');

      return { success: true, opportunities };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Failed to identify value bet opportunities', error, { minExpectedValue }, 'MarketCorrelationService');
      return { success: false, error: errorMessage };
    }
  }

  // Private helper methods
  private groupSignalsByType(signals: MarketSignal[]): Record<string, MarketSignal[]> {
    const groups: Record<string, MarketSignal[]> = {};
    signals.forEach(signal => {
      if (!groups[signal.signal_type]) {
        groups[signal.signal_type] = [];
      }
      groups[signal.signal_type].push(signal);
    });
    return groups;
  }

  private groupSignalsByLeague(signals: MarketSignal[]): Record<string, MarketSignal[]> {
    const groups: Record<string, MarketSignal[]> = {};
    signals.forEach(signal => {
      const leagueId = signal.league_id || 'unknown';
      if (!groups[leagueId]) {
        groups[leagueId] = [];
      }
      groups[leagueId].push(signal);
    });
    return groups;
  }

  private alignSignalsByTime(signals1: MarketSignal[], signals2: MarketSignal[]): Array<{
    timestamp: string;
    value1: number;
    value2: number;
  }> {
    const aligned: Array<{ timestamp: string; value1: number; value2: number }> = [];
    
    const signals2Map = new Map(
      signals2.map(s => [s.timestamp, s.value])
    );

    for (const signal1 of signals1) {
      const value2 = signals2Map.get(signal1.timestamp);
      if (value2 !== undefined) {
        aligned.push({
          timestamp: signal1.timestamp,
          value1: signal1.value,
          value2: value2
        });
      }
    }

    return aligned;
  }

  private calculateCorrelation(x: number[], y: number, method: string = 'pearson'): number {
    const n = x.length;
    if (n === 0) return 0;

    switch (method) {
      case 'pearson':
        return this.pearsonCorrelation(x, y);
      case 'spearman':
        return this.spearmanCorrelation(x, y);
      case 'kendall':
        return this.kendallCorrelation(x, y);
      default:
        return this.pearsonCorrelation(x, y);
    }
  }

  private pearsonCorrelation(x: number[], y: number): number {
    const n = x.length;
    if (n === 0) return 0;

    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
  }

  private spearmanCorrelation(x: number[], y: number): number {
    const rankX = this.getRanks(x);
    const rankY = this.getRanks(y);
    return this.pearsonCorrelation(rankX, rankY);
  }

  private kendallCorrelation(x: number[], y: number): number {
    const n = x.length;
    if (n === 0) return 0;

    let concordant = 0;
    let discordant = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const diffX = x[i] - x[j];
        const diffY = y[i] - y[j];
        
        if (diffX * diffY > 0) {
          concordant++;
        } else if (diffX * diffY < 0) {
          discordant++;
        }
      }
    }

    return (concordant - discordant) / (n * (n - 1) / 2);
  }

  private getRanks(values: number[]): number[] {
    const indexed = values.map((value, index) => ({ value, index }));
    indexed.sort((a, b) => a.value - b.value);
    
    const ranks = new Array(values.length);
    indexed.forEach((item, rank) => {
      ranks[item.index] = rank + 1;
    });
    
    return ranks;
  }

  private calculateSignificance(
    correlation: number,
    sampleSize: number,
    confidenceLevel: number = 0.95
  ): { pValue: number; confidenceInterval: [number, number] } {
    // Fisher's z-transformation for confidence interval
    const z = Math.atanh(correlation);
    const se = 1 / Math.sqrt(sampleSize - 3);
    const zScore = Math.abs(z) / se;
    
    // Calculate p-value (two-tailed)
    const pValue = 2 * (1 - this.normalCDF(zScore));
    
    // Calculate confidence interval
    const zCritical = this.normalQuantile(1 - (1 - confidenceLevel) / 2);
    const zLower = z - zCritical * se;
    const zUpper = z + zCritical * se;
    
    const confidenceInterval: [number, number] = [
      Math.tanh(zLower),
      Math.tanh(zUpper)
    ];

    return { pValue, confidenceInterval };
  }

  private normalCDF(x: number): number {
    return 0.5 * (1 + this.erf(x / Math.sqrt(2)));
  }

  private normalQuantile(p: number): number {
    // Approximation of the inverse normal CDF
    const a1 = -3.969683028665376e+01;
    const a2 = 2.209460984245205e+02;
    const a3 = -2.759285104469687e+02;
    const a4 = 1.383577518672690e+02;
    const a5 = -3.066479806614716e+01;
    const a6 = 2.506628277459239e+00;

    const b1 = -5.447609879822406e+01;
    const b2 = 1.615858368580409e+02;
    const b3 = -1.556989798598866e+02;
    const b4 = 6.680131188771972e+01;
    const b5 = -1.328068155288572e+01;

    const t = Math.sqrt(-2 * Math.log(p));
    const numerator = a1 + t * (a2 + t * (a3 + t * (a4 + t * (a5 + t * a6))));
    const denominator = b1 + t * (b2 + t * (b3 + t * (b4 + t * b5)));

    return -numerator / denominator;
  }

  private erf(x: number): number {
    // Approximation of the error function
    const a1 =  0.254829592;
    const a2 = -0.284496736;
    const a3 =  1.421413741;
    const a4 = -1.453152027;
    const a5 =  1.061405429;
    const p  =  0.3275911;

    const sign = x >= 0 ? 1 : -1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

    return sign * y;
  }

  private removeOutliers(data: Array<{ timestamp: string; value1: number; value2: number }>): Array<{ timestamp: string; value1: number; value2: number }> {
    const values1 = data.map(d => d.value1);
    const values2 = data.map(d => d.value2);

    const q1_1 = this.percentile(values1, 25);
    const q3_1 = this.percentile(values1, 75);
    const iqr_1 = q3_1 - q1_1;
    const lowerBound_1 = q1_1 - 1.5 * iqr_1;
    const upperBound_1 = q3_1 + 1.5 * iqr_1;

    const q1_2 = this.percentile(values2, 25);
    const q3_2 = this.percentile(values2, 75);
    const iqr_2 = q3_2 - q1_2;
    const lowerBound_2 = q1_2 - 1.5 * iqr_2;
    const upperBound_2 = q3_2 + 1.5 * iqr_2;

    return data.filter(d => 
      d.value1 >= lowerBound_1 && d.value1 <= upperBound_1 &&
      d.value2 >= lowerBound_2 && d.value2 <= upperBound_2
    );
  }

  private normalizeSignalData(data: Array<{ timestamp: string; value1: number; value2: number }>): Array<{ timestamp: string; value1: number; value2: number }> {
    const values1 = data.map(d => d.value1);
    const values2 = data.map(d => d.value2);

    const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
    const std1 = Math.sqrt(values1.reduce((sum, v) => sum + Math.pow(v - mean1, 2), 0) / values1.length);

    const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
    const std2 = Math.sqrt(values2.reduce((sum, v) => sum + Math.pow(v - mean2, 2), 0) / values2.length);

    return data.map(d => ({
      ...d,
      value1: (d.value1 - mean1) / std1,
      value2: (d.value2 - mean2) / std2
    }));
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index % 1;

    if (upper >= sorted.length) return sorted[sorted.length - 1];
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }

  private applyLag(data: Array<{ timestamp: string; value1: number; value2: number }>, lagPeriod: number): Array<{ timestamp: string; value1: number; value2: number }> {
    if (lagPeriod <= 0 || lagPeriod >= data.length) return data;

    return data.slice(lagPeriod).map((item, index) => ({
      timestamp: item.timestamp,
      value1: item.value1,
      value2: data[index].value2
    }));
  }

  private calculateTrendDirection(correlations: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (correlations.length < 2) return 'stable';

    const firstHalf = correlations.slice(0, Math.floor(correlations.length / 2));
    const secondHalf = correlations.slice(Math.floor(correlations.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const difference = secondAvg - firstAvg;
    const threshold = 0.1; // 10% change threshold

    if (difference > threshold) return 'increasing';
    if (difference < -threshold) return 'decreasing';
    return 'stable';
  }

  private findOptimalLag(data: Array<{ timestamp: string; value1: number; value2: number }>): number {
    let maxCorrelation = 0;
    let optimalLag = 0;

    for (let lag = 0; lag < Math.min(30, data.length / 2); lag++) {
      const laggedData = this.applyLag(data, lag);
      if (laggedData.length < 10) continue;

      const correlation = Math.abs(this.calculateCorrelation(
        laggedData.map(d => d.value1),
        laggedData.map(d => d.value2)
      ));

      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        optimalLag = lag;
      }
    }

    return optimalLag;
  }

  private performStationarityTests(correlations: number[]): {
    augmented_dickey_fuller: number;
    phillips_perron: number;
    kpss: number;
  } {
    // Simplified implementations of stationarity tests
    // In production, these would use proper statistical libraries
    
    const n = correlations.length;
    if (n < 10) {
      return {
        augmented_dickey_fuller: 1.0,
        phillips_perron: 1.0,
        kpss: 0.1
      };
    }

    // Simple approximations
    const diff = correlations.slice(1).map((c, i) => c - correlations[i]);
    const diffMean = diff.reduce((a, b) => a + b, 0) / diff.length;
    const diffVar = diff.reduce((sum, d) => sum + Math.pow(d - diffMean, 2), 0) / diff.length;

    return {
      augmented_dickey_fuller: Math.max(0.01, 1 - diffVar),
      phillips_perron: Math.max(0.01, 1 - diffVar * 0.9),
      kpss: Math.min(0.99, diffVar * 2)
    };
  }

  private async fetchExternalSignals(options: MarketSignalsFetchOptions): Promise<MarketSignal[]> {
    // Placeholder for external signal fetching
    // In production, this would integrate with external APIs
    return [];
  }

  private getOutcomeProbability(prediction: any, outcome: string): number | null {
    // Extract probability from prediction based on outcome type
    switch (outcome) {
      case 'home_win':
        return prediction.home_win_probability || null;
      case 'draw':
        return prediction.draw_probability || null;
      case 'away_win':
        return prediction.away_win_probability || null;
      case 'over_2_5':
        return prediction.over_2_5_probability || null;
      case 'under_2_5':
        return prediction.under_2_5_probability || null;
      case 'btts_yes':
        return prediction.btts_yes_probability || null;
      case 'btts_no':
        return prediction.btts_no_probability || null;
      default:
        return null;
    }
  }

  private calculateKellyFraction(expectedValue: number, probability: number): number {
    // Kelly criterion: f* = (bp - q) / b
    // where b = odds - 1, p = probability of winning, q = probability of losing
    const odds = 1 / probability;
    const b = odds - 1;
    const p = probability;
    const q = 1 - p;

    const kellyFraction = (b * p - q) / b;
    
    // Cap at 25% of bankroll and ensure positive
    return Math.max(0, Math.min(0.25, kellyFraction));
  }

  private getConfidenceLevel(
    predictionConfidence: number,
    correlationStrength: number,
    expectedValue: number
  ): 'high' | 'medium' | 'low' {
    const combinedScore = (predictionConfidence * 0.4) + (correlationStrength * 0.3) + (Math.min(expectedValue * 2, 1) * 0.3);

    if (combinedScore >= 0.8) return 'high';
    if (combinedScore >= 0.6) return 'medium';
    return 'low';
  }
}

export const marketCorrelationService = new MarketCorrelationService();

// Collaborative Intelligence Service
class CollaborativeIntelligenceServiceClass {
  async submitUserPrediction(
    predictionData: {
      match_id: string;
      predicted_outcome: 'home_win' | 'draw' | 'away_win';
      confidence_score: number;
      predicted_home_score?: number;
      predicted_away_score?: number;
      btts_prediction?: boolean;
      over_under_prediction?: 'over_2.5' | 'under_2.5';
      reasoning?: string;
    },
    userId: string
  ): Promise<{ success: boolean; error?: string; prediction?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke('phase9-collaborative-intelligence/predictions/user', {
        body: {
          ...predictionData,
          user_id: userId
        }
      });

      if (error) {
        logger.error('Failed to submit user prediction', { error });
        return { success: false, error: error.message };
      }

      return { success: true, prediction: data };
    } catch (error) {
      logger.error('Error submitting user prediction', { error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getCrowdWisdom(matchId: string): Promise<{ success: boolean; error?: string; crowdWisdom?: any }> {
    try {
      const { data, error } = await supabase.functions.invoke(`phase9-collaborative-intelligence/predictions/crowd/${matchId}`);

      if (error) {
        logger.error('Failed to fetch crowd wisdom', { error, matchId });
        return { success: false, error: error.message };
      }

      return { success: true, crowdWisdom: data };
    } catch (error) {
      logger.error('Error fetching crowd wisdom', { error, matchId });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const CollaborativeIntelligenceService = new CollaborativeIntelligenceServiceClass();

// Market Integration Service
class MarketIntegrationServiceClass {
  async fetchExternalOdds(matchId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('phase9-market-integration', {
        body: { matchId, action: 'fetchOdds' }
      });

      if (error) {
        logger.error('Failed to fetch external odds', { error, matchId });
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      logger.error('Error fetching external odds', { error, matchId });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getMarketOdds(matchId: string): Promise<{ success: boolean; odds?: any; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('market_odds')
        .select('*')
        .eq('match_id', matchId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        logger.error('Failed to get market odds', { error, matchId });
        return { success: false, error: error.message };
      }

      return { success: true, odds: data };
    } catch (error) {
      logger.error('Error getting market odds', { error, matchId });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async calculateValueBets(matchId: string): Promise<{ success: boolean; valueBets?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('phase9-market-integration', {
        body: { matchId, action: 'calculateValueBets' }
      });

      if (error) {
        logger.error('Failed to calculate value bets', { error, matchId });
        return { success: false, error: error.message };
      }

      return { success: true, valueBets: data?.valueBets || [] };
    } catch (error) {
      logger.error('Error calculating value bets', { error, matchId });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  async getValueBets(maxResults: number = 10): Promise<{ success: boolean; valueBets?: any[]; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('phase9-market-integration', {
        body: { action: 'getValueBets', maxResults }
      });

      if (error) {
        logger.error('Failed to get value bets', { error, maxResults });
        return { success: false, error: error.message };
      }

      return { success: true, valueBets: data?.valueBets || [] };
    } catch (error) {
      logger.error('Error getting value bets', { error, maxResults });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const MarketIntegrationService = new MarketIntegrationServiceClass();

// Temporal Decay Service
class TemporalDecayServiceClass {
  /**
   * Calculate freshness score for a given record
   * @param tableName - Name of the table
   * @param recordId - ID of the record
   * @returns Freshness score (0-100, where 100 is most fresh)
   */
  async calculateFreshnessScore(
    tableName: string,
    recordId: string
  ): Promise<{ success: boolean; score?: number; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('phase9-temporal-decay', {
        body: { action: 'calculateFreshness', tableName, recordId }
      });

      if (error) {
        logger.error('Failed to calculate freshness score', { error, tableName, recordId });
        return { success: false, error: error.message };
      }

      return { success: true, score: data?.freshnessScore ?? 0 };
    } catch (error) {
      logger.error('Error calculating freshness score', { error, tableName, recordId });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check for stale data and trigger refresh if needed
   * @returns List of stale records that need refresh
   */
  async checkAndRefreshStaleData(): Promise<{
    success: boolean;
    staleRecords?: Array<{ tableName: string; recordId: string; staleness: number }>;
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('phase9-temporal-decay', {
        body: { action: 'checkStaleData' }
      });

      if (error) {
        logger.error('Failed to check and refresh stale data', { error });
        return { success: false, error: error.message };
      }

      return { success: true, staleRecords: data?.staleRecords ?? [] };
    } catch (error) {
      logger.error('Error checking stale data', { error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Get decay metrics for monitoring
   */
  async getDecayMetrics(): Promise<{
    success: boolean;
    metrics?: {
      avgFreshness: number;
      staleCount: number;
      lastRefresh: string;
    };
    error?: string;
  }> {
    try {
      const { data, error } = await supabase.functions.invoke('phase9-temporal-decay', {
        body: { action: 'getMetrics' }
      });

      if (error) {
        logger.error('Failed to get decay metrics', { error });
        return { success: false, error: error.message };
      }

      return { success: true, metrics: data?.metrics };
    } catch (error) {
      logger.error('Error getting decay metrics', { error });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }
}

export const TemporalDecayService = new TemporalDecayServiceClass();