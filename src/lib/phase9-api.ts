// Phase 9: Advanced Features API Services

import { supabase } from '@/integrations/supabase/client';
import { env } from '@/config/env';
import type { 
  UserPrediction, CrowdWisdom, MarketOdds, ValueBet, InformationFreshness, FeatureExperiment, 
  UserPredictionForm, UserPredictionResponse, CrowdWisdomResponse, MarketOddsResponse, ValueBetsResponse, 
  FreshnessScoreResponse, StaleDataCheckResponse, FeatureGenerationRequest, FeatureGenerationResponse, 
  ContinuousLearningResponse, DivergenceAnalysis 
} from '@/types/phase9';

// 9.1 Collaborative Intelligence API Services

export class CollaborativeIntelligenceService {
  /**
   * Submit a user prediction for a match
   */
  static async submitUserPrediction(prediction: UserPredictionForm, userId: string = 'anonymous' // In production, get from auth
  ): Promise<UserPredictionResponse> {
    try {
      const {
        data,
        error
      } = await supabase.from('user_predictions').insert({
        ...prediction,
        user_id: userId
      }).select().single();
      if (error) throw error;

      // Update crowd wisdom aggregation after new prediction
      await this.updateCrowdWisdom(prediction.match_id);
      return {
        success: true,
        prediction: data as UserPrediction
      };
    } catch (error) {
      console.error('Error submitting user prediction:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit prediction'
      };
    }
  }

  /**
   * Get crowd wisdom for a specific match
   */
  static async getCrowdWisdom(matchId: string): Promise<CrowdWisdomResponse> {
    try {
      const {
        data,
        error
      } = await supabase.from('crowd_wisdom').select('*').eq('match_id', matchId).single();
      if (error && error.code !== 'PGRST116') {
        // PGRST116 = not found
        throw error;
      }
      return {
        success: true,
        crowdWisdom: data as CrowdWisdom || null
      };
    } catch (error) {
      console.error('Error fetching crowd wisdom:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch crowd wisdom'
      };
    }
  }

  /**
   * Get user predictions for a match
   */
  static async getUserPredictions(matchId: string): Promise<{
    success: boolean;
    predictions?: UserPrediction[];
    error?: string;
  }> {
    try {
      const {
        data,
        error
      } = await supabase.from('user_predictions').select('*').eq('match_id', matchId).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      return {
        success: true,
        predictions: data as UserPrediction[]
      };
    } catch (error) {
      console.error('Error fetching user predictions:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch user predictions'
      };
    }
  }

  /**
   * Update crowd wisdom aggregation (internal method)
   */
  private static async updateCrowdWisdom(matchId: string): Promise<void> {
    try {
      const {
        error
      } = await supabase.rpc('update_crowd_wisdom', {
        p_match_id: matchId
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error updating crowd wisdom:', error);
      // Don't throw here, as this is a background operation
    }
  }

  /**
   * Analyze divergence between model and crowd predictions
   */
  static async analyzeDivergence(matchId: string): Promise<{
    success: boolean;
    analysis?: DivergenceAnalysis;
    error?: string;
  }> {
    try {
      // Get model prediction
      const {
        data: modelData,
        error: modelError
      } = await supabase.from('predictions').select('predicted_outcome, confidence_score').eq('match_id', matchId).single();
      if (modelError && modelError.code !== 'PGRST116') throw modelError;

      // Get crowd wisdom
      const crowdResult = await this.getCrowdWisdom(matchId);
      if (!crowdResult.success || !crowdResult.crowdWisdom) {
        throw new Error('No crowd wisdom data available');
      }
      const crowdWisdom = crowdResult.crowdWisdom;
      if (!modelData || !crowdWisdom.consensus_prediction) {
        throw new Error('Insufficient data for divergence analysis');
      }
      const divergence = crowdWisdom.model_vs_crowd_divergence;
      let interpretation: 'high' | 'medium' | 'low';
      if (divergence > 30) interpretation = 'high';else if (divergence > 15) interpretation = 'medium';else interpretation = 'low';
      let recommendation: string;
      if (interpretation === 'high') {
        recommendation = 'Significant disagreement between model and crowd. Consider investigating further.';
      } else if (interpretation === 'medium') {
        recommendation = 'Moderate disagreement. Worth monitoring for potential insights.';
      } else {
        recommendation = 'Good agreement between model and crowd. High confidence in predictions.';
      }
      const analysis: DivergenceAnalysis = {
        modelPrediction: modelData.predicted_outcome,
        modelConfidence: modelData.confidence_score,
        crowdConsensus: crowdWisdom.consensus_prediction,
        crowdConfidence: crowdWisdom.consensus_confidence,
        divergence,
        interpretation,
        recommendation
      };
      return {
        success: true,
        analysis
      };
    } catch (error) {
      console.error('Error analyzing divergence:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to analyze divergence'
      };
    }
  }
}

// 9.2 Market Integration API Services
export class MarketIntegrationService {
  // Biztonságos elérés optional chaining-gel
  private static readonly API_KEY = env.oddsApi?.key || '';
  
  /**
   * Fetch odds from external API for a specific match
   */
  static async fetchExternalOdds(matchId: string): Promise<MarketOddsResponse> {
    try {
      // In a real implementation, you would map matchId to the format expected by the odds API
      // For now, we'll simulate the API call with mock data
      if (!this.API_KEY) {
        console.warn('Odds API key not configured - using mock data');
        // Demo mode: return mock data instead of throwing error
        return {
          success: true,
          odds: []
        };
      }
      
      // Simulate API call with retry logic and exponential backoff
      const oddsData = await this.fetchOddsWithRetry(matchId);
      
      if (!oddsData.success) {
        throw new Error(oddsData.error);
      }
      
      // Store odds in database
      const storedOdds = await this.storeMarketOdds(matchId, oddsData.data!);
      
      return {
        success: true,
        odds: storedOdds
      };
    } catch (error) {
      console.error('Error fetching external odds:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch external odds'
      };
    }
  }
  
  /**
   * Get stored market odds for a match
   */
  static async getMarketOdds(matchId: string): Promise<MarketOddsResponse> {
    try {
      const {
        data,
        error
      } = await supabase.from('market_odds').select('*').eq('match_id', matchId).order('last_updated', {
        ascending: false
      });
      
      if (error) throw error;
      
      return {
        success: true,
        odds: data as MarketOdds[]
      };
    } catch (error) {
      console.error('Error fetching market odds:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch market odds'
      };
    }
  }
  

  /**
   * Calculate and store value bets
   */
  static async calculateValueBets(matchId?: string): Promise<ValueBetsResponse> {
    try {
      // Get model predictions
      let modelQuery = supabase.from('predictions').select('*');
      if (matchId) {
        modelQuery = modelQuery.eq('match_id', matchId);
      }
      const {
        data: modelPredictions,
        error: modelError
      } = await modelQuery;
      if (modelError) throw modelError;
      if (!modelPredictions || modelPredictions.length === 0) {
        return {
          success: true,
          valueBets: []
        };
      }
      const valueBets: ValueBet[] = [];

      // Process each prediction
      for (const prediction of modelPredictions) {
        // Get market odds for this match
        const oddsResult = await this.getMarketOdds(prediction.match_id);
        if (!oddsResult.success || !oddsResult.odds || oddsResult.odds.length === 0) {
          continue;
        }

        // Calculate value bets for each bookmaker
        for (const odds of oddsResult.odds) {
          const modelProb = prediction.confidence_score / 100;

          // Calculate expected value for each outcome
          const outcomes = [{
            type: 'home_win',
            odds: odds.home_win_odds,
            modelProb: this.getOutcomeProbability(prediction, 'home_win')
          }, {
            type: 'draw',
            odds: odds.draw_odds,
            modelProb: this.getOutcomeProbability(prediction, 'draw')
          }, {
            type: 'away_win',
            odds: odds.away_win_odds,
            modelProb: this.getOutcomeProbability(prediction, 'away_win')
          }];
          for (const outcome of outcomes) {
            const ev = this.calculateExpectedValue(outcome.odds, outcome.modelProb);
            const kelly = this.calculateKellyFraction(outcome.odds, outcome.modelProb);
            if (ev > 0) {
              // Only consider positive EV bets
              const confidenceLevel = this.getConfidenceLevel(ev, kelly);
              const valueBet: ValueBet = {
                id: '',
                // Will be set by database
                match_id: prediction.match_id,
                bookmaker: odds.bookmaker,
                bet_type: outcome.type as ValueBet['bet_type'],
                bookmaker_odds: outcome.odds,
                model_probability: outcome.modelProb,
                implied_probability: 1 / outcome.odds,
                expected_value: ev,
                kelly_fraction: kelly,
                confidence_level: confidenceLevel,
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              };
              valueBets.push(valueBet);
            }
          }
        }
      }

      // Store value bets in database
      if (valueBets.length > 0) {
        const {
          data: storedBets,
          error: storeError
        } = await supabase.from('value_bets').upsert(valueBets, {
          onConflict: 'match_id,bookmaker,bet_type'
        }).select();
        if (storeError) throw storeError;
        return {
          success: true,
          valueBets: storedBets as ValueBet[]
        };
      }
      return {
        success: true,
        valueBets: []
      };
    } catch (error) {
      console.error('Error calculating value bets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate value bets'
      };
    }
  }

  /**
   * Get active value bets
   */
  static async getValueBets(maxResults: number = 50): Promise<ValueBetsResponse> {
    try {
      const {
        data,
        error
      } = await supabase.from('value_bets').select('*').eq('is_active', true).order('expected_value', {
        ascending: false
      }).limit(maxResults);
      if (error) throw error;
      return {
        success: true,
        valueBets: data as ValueBet[]
      };
    } catch (error) {
      console.error('Error fetching value bets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch value bets'
      };
    }
  }

  /**
   * Fetch odds with retry logic and exponential backoff
   */
  private static async fetchOddsWithRetry(matchId: string, maxRetries: number = 3): Promise<{
    success: boolean;
    data?: unknown;
    error?: string;
  }> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Simulate API call - in real implementation, call actual odds API
        const mockOddsData = this.generateMockOddsData(matchId);
        return {
          success: true,
          data: mockOddsData
        };
      } catch (error) {
        if (attempt === maxRetries - 1) {
          return {
            success: false,
            error: `Failed after ${maxRetries} attempts: ${error instanceof Error ? error.message : 'Unknown error'}`
          };
        }

        // Exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    return {
      success: false,
      error: 'Max retries exceeded'
    };
  }

  /**
   * Generate mock odds data (replace with real API call)
   */
  private static generateMockOddsData(matchId: string) {
    return {
      success: true,
      data: [{
        bookmaker: 'Bet365',
        home_win_odds: 2.1 + Math.random() * 0.4,
        draw_odds: 3.2 + Math.random() * 0.4,
        away_win_odds: 3.4 + Math.random() * 0.4,
        over_2_5_odds: 1.8 + Math.random() * 0.2,
        under_2_5_odds: 2.0 + Math.random() * 0.2,
        btts_yes_odds: 1.7 + Math.random() * 0.2,
        btts_no_odds: 2.1 + Math.random() * 0.2
      }, {
        bookmaker: 'William Hill',
        home_win_odds: 2.05 + Math.random() * 0.4,
        draw_odds: 3.3 + Math.random() * 0.4,
        away_win_odds: 3.5 + Math.random() * 0.4,
        over_2_5_odds: 1.85 + Math.random() * 0.2,
        under_2_5_odds: 1.95 + Math.random() * 0.2,
        btts_yes_odds: 1.75 + Math.random() * 0.2,
        btts_no_odds: 2.05 + Math.random() * 0.2
      }]
    };
  }

  /**
   * Store market odds in database
   */
  private static async storeMarketOdds(matchId: string, oddsData: unknown[]): Promise<MarketOdds[]> {
    const storedOdds: MarketOdds[] = [];
    for (const odds of oddsData) {
      const {
        data,
        error
      } = await supabase.from('market_odds').upsert({
        match_id: matchId,
        bookmaker: odds.bookmaker,
        home_win_odds: odds.home_win_odds,
        draw_odds: odds.draw_odds,
        away_win_odds: odds.away_win_odds,
        over_2_5_odds: odds.over_2_5_odds,
        under_2_5_odds: odds.under_2_5_odds,
        btts_yes_odds: odds.btts_yes_odds,
        btts_no_odds: odds.btts_no_odds,
        last_updated: new Date().toISOString(),
        api_source: 'odds-api',
        raw_response: odds
      }, {
        onConflict: 'match_id,bookmaker'
      }).select().single();
      if (error) throw error;
      storedOdds.push(data as MarketOdds);
    }
    return storedOdds;
  }

  /**
   * Get outcome probability from model prediction
   */
  private static getOutcomeProbability(prediction: UserPrediction, outcome: string): number {
    // In a real implementation, this would extract the probability for the specific outcome
    // For now, we'll use a simplified approach based on confidence score
    const baseProb = prediction.confidence_score / 100;
    if (prediction.predicted_outcome === outcome) {
      return baseProb;
    } else {
      // Distribute remaining probability among other outcomes
      return (1 - baseProb) / 2;
    }
  }

  /**
   * Calculate expected value
   */
  private static calculateExpectedValue(odds: number, modelProbability: number): number {
    return modelProbability * odds - 1;
  }

  /**
   * Calculate Kelly Criterion fraction
   */
  private static calculateKellyFraction(odds: number, modelProbability: number): number {
    const edge = modelProbability * odds - 1;
    return Math.max(0, Math.min(1, edge / (odds - 1)));
  }

  /**
   * Get confidence level based on EV and Kelly
   */
  private static getConfidenceLevel(ev: number, kelly: number): 'low' | 'medium' | 'high' {
    if (ev > 0.15 && kelly > 0.1) return 'high';
    if (ev > 0.08 && kelly > 0.05) return 'medium';
    return 'low';
  }
}

// 9.3 Temporal Decay API Services

export class TemporalDecayService {
  /**
   * Calculate freshness score for data
   */
  static async calculateFreshnessScore(tableName: string, recordId: string, decayRate?: number): Promise<FreshnessScoreResponse> {
    try {
      const {
        data,
        error
      } = await supabase.from('information_freshness').select('*').eq('table_name', tableName).eq('record_id', recordId).single();
      if (error && error.code !== 'PGRST116') throw error;
      let freshness: InformationFreshness;
      if (data) {
        freshness = data as InformationFreshness;
      } else {
        // Create new freshness record
        const newFreshness = await this.createFreshnessRecord(tableName, recordId, decayRate);
        if (!newFreshness.success) {
          throw new Error(newFreshness.error);
        }
        freshness = newFreshness.freshness!;
      }

      // Calculate current freshness score using database function
      const {
        data: scoreData,
        error: scoreError
      } = await supabase.rpc('calculate_freshness_score', {
        last_updated: freshness.last_updated,
        decay_rate: freshness.decay_rate
      });
      if (scoreError) throw scoreError;
      const freshnessScore = scoreData;
      const isStale = freshnessScore < 0.5; // Consider stale if freshness < 50%

      // Update the freshness record
      await supabase.from('information_freshness').update({
        freshness_score: freshnessScore,
        is_stale: isStale
      }).eq('id', freshness.id);
      return {
        success: true,
        freshness_score: freshnessScore,
        is_stale: isStale
      };
    } catch (error) {
      console.error('Error calculating freshness score:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate freshness score'
      };
    }
  }

  /**
   * Check for stale data and refresh if needed
   */
  static async checkAndRefreshStaleData(): Promise<StaleDataCheckResponse> {
    try {
      // Get all stale records
      const {
        data: staleRecords,
        error: fetchError
      } = await supabase.from('information_freshness').select('*').eq('is_stale', true);
      if (fetchError) throw fetchError;
      let refreshedCount = 0;

      // Refresh each stale record
      for (const record of staleRecords as InformationFreshness[]) {
        const refreshResult = await this.refreshStaleRecord(record);
        if (refreshResult.success) {
          refreshedCount++;
        }
      }
      return {
        success: true,
        staleRecords: staleRecords as InformationFreshness[],
        refreshedCount
      };
    } catch (error) {
      console.error('Error checking stale data:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to check stale data'
      };
    }
  }

  /**
   * Create a new freshness record
   */
  private static async createFreshnessRecord(tableName: string, recordId: string, decayRate?: number): Promise<{
    success: boolean;
    freshness?: InformationFreshness;
    error?: string;
  }> {
    try {
      // Determine data type and default decay rate
      let dataType: string;
      let defaultDecayRate: number;
      let staleThresholdDays: number;
      switch (tableName) {
        case 'matches':
          dataType = 'match';
          defaultDecayRate = 0.05;
          staleThresholdDays = 3;
          break;
        case 'predictions':
          dataType = 'user_prediction';
          defaultDecayRate = 0.1;
          staleThresholdDays = 7;
          break;
        case 'market_odds':
          dataType = 'odds';
          defaultDecayRate = 0.5;
          staleThresholdDays = 1;
          break;
        default:
          dataType = 'pattern';
          defaultDecayRate = 0.15;
          staleThresholdDays = 5;
      }
      const {
        data,
        error
      } = await supabase.from('information_freshness').insert({
        table_name: tableName,
        record_id: recordId,
        data_type: dataType as 'match' | 'team_stats' | 'pattern' | 'odds' | 'user_prediction',
        last_updated: new Date().toISOString(),
        decay_rate: decayRate || defaultDecayRate,
        freshness_score: 1.0,
        is_stale: false,
        stale_threshold_days: staleThresholdDays
      }).select().single();
      if (error) throw error;
      return {
        success: true,
        freshness: data as InformationFreshness
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create freshness record'
      };
    }
  }

  /**
   * Refresh a stale record
   */
  private static async refreshStaleRecord(record: InformationFreshness): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // In a real implementation, this would trigger data refresh based on the table type
      // For now, we'll just update the last_updated timestamp

      const {
        error
      } = await supabase.from('information_freshness').update({
        last_updated: new Date().toISOString(),
        freshness_score: 1.0,
        is_stale: false
      }).eq('id', record.id);
      if (error) throw error;
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to refresh stale record'
      };
    }
  }
}

// 9.4 Self-Improving System API Services

export class SelfImprovingSystemService {
  /**
   * Generate new features through automated feature engineering
   */
  static async generateNewFeatures(request: FeatureGenerationRequest): Promise<FeatureGenerationResponse> {
    try {
      const experiments: FeatureExperiment[] = [];

      // Generate different types of features
      for (const featureType of request.feature_types) {
        const typeExperiments = await this.generateFeaturesByType(featureType, request.base_features, request.sample_size || 1000, request.test_duration_days || 30);
        experiments.push(...typeExperiments);
      }

      // Store experiments in database
      if (experiments.length > 0) {
        const {
          data: storedExperiments,
          error: storeError
        } = await supabase.from('feature_experiments').insert(experiments).select();
        if (storeError) throw storeError;
        return {
          success: true,
          experiments: storedExperiments as FeatureExperiment[]
        };
      }
      return {
        success: true,
        experiments: []
      };
    } catch (error) {
      console.error('Error generating new features:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate new features'
      };
    }
  }

  /**
   * Run continuous learning pipeline
   */
  static async runContinuousLearning(): Promise<ContinuousLearningResponse> {
    try {
      let experimentsGenerated = 0;
      let experimentsCompleted = 0;
      let featuresApproved = 0;
      let modelAccuracyImprovement = 0;

      // Step 1: Generate new feature experiments
      const generationRequest: FeatureGenerationRequest = {
        feature_types: ['polynomial', 'interaction', 'ratio'],
        base_features: ['home_form', 'away_form', 'h2h_record', 'league_avg_goals'],
        sample_size: 2000,
        test_duration_days: 14
      };
      const generationResult = await this.generateNewFeatures(generationRequest);
      if (generationResult.success && generationResult.experiments) {
        experimentsGenerated = generationResult.experiments.length;

        // Step 2: Test each experiment
        for (const experiment of generationResult.experiments) {
          const testResult = await this.testFeature(experiment.id);
          if (testResult.success) {
            experimentsCompleted++;

            // Step 3: Approve successful features
            if (testResult.result!.recommendation === 'approve') {
              await this.approveFeature(experiment.id);
              featuresApproved++;
            }
          }
        }
      }

      // Step 4: Calculate model accuracy improvement
      const improvementResult = await this.calculateModelImprovement();
      if (improvementResult.success) {
        modelAccuracyImprovement = improvementResult.improvement || 0;
      }
      return {
        success: true,
        results: {
          experimentsGenerated,
          experimentsCompleted,
          featuresApproved,
          modelAccuracyImprovement
        }
      };
    } catch (error) {
      console.error('Error running continuous learning:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to run continuous learning'
      };
    }
  }

  /**
   * Test a specific feature experiment
   */
  static async testFeature(experimentId: string): Promise<{
    success: boolean;
    result?: FeatureTestResult;
    error?: string;
  }> {
    try {
      // Get experiment details
      const {
        data: experiment,
        error: fetchError
      } = await supabase.from('feature_experiments').select('*').eq('id', experimentId).single();
      if (fetchError) throw fetchError;

      // Simulate A/B testing - in real implementation, this would run actual tests
      const controlAccuracy = 65 + Math.random() * 10; // 65-75%
      const testAccuracy = controlAccuracy + (Math.random() - 0.3) * 5; // -1.5% to +3.5%
      const improvement = testAccuracy - controlAccuracy;
      const pValue = Math.random(); // Simulated p-value

      const statisticalSignificance = pValue < 0.05 && improvement > 0;
      let recommendation: 'approve' | 'reject' | 'continue_testing';
      if (statisticalSignificance && improvement > 2) {
        recommendation = 'approve';
      } else if (improvement > 0 && pValue < 0.1) {
        recommendation = 'continue_testing';
      } else {
        recommendation = 'reject';
      }

      // Update experiment with results
      const {
        error: updateError
      } = await supabase.from('feature_experiments').update({
        test_end_date: new Date().toISOString(),
        sample_size: Math.floor(Math.random() * 1000) + 500,
        control_accuracy: controlAccuracy,
        test_accuracy: testAccuracy,
        improvement_delta: improvement,
        p_value: pValue,
        statistical_significance: statisticalSignificance,
        is_active: false
      }).eq('id', experimentId);
      if (updateError) throw updateError;
      const result = {
        experiment_id: experimentId,
        control_accuracy: controlAccuracy,
        test_accuracy: testAccuracy,
        improvement_delta: improvement,
        p_value: pValue,
        statistical_significance: statisticalSignificance,
        recommendation
      };
      return {
        success: true,
        result
      };
    } catch (error) {
      console.error('Error testing feature:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to test feature'
      };
    }
  }

  /**
   * Generate features by type
   */
  private static async generateFeaturesByType(featureType: string, baseFeatures: string[], sampleSize: number, testDurationDays: number): Promise<FeatureExperiment[]> {
    const experiments: FeatureExperiment[] = [];
    switch (featureType) {
      case 'polynomial':
        // Generate polynomial features (e.g., x², x³)
        for (const feature of baseFeatures) {
          for (let degree = 2; degree <= 3; degree++) {
            experiments.push({
              id: '',
              // Will be set by database
              experiment_name: `${feature}_poly_${degree}`,
              feature_type: 'polynomial',
              base_features: {
                features: [feature]
              },
              generated_feature: {
                name: `${feature}_power_${degree}`,
                description: `Polynomial feature: ${feature}^${degree}`
              },
              feature_expression: `${feature}^${degree}`,
              test_start_date: new Date().toISOString(),
              test_end_date: new Date(Date.now() + testDurationDays * 24 * 60 * 60 * 1000).toISOString(),
              sample_size: sampleSize,
              statistical_significance: false,
              is_active: true,
              is_approved: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
        break;
      case 'interaction':
        // Generate interaction features (e.g., x₁ * x₂)
        for (let i = 0; i < baseFeatures.length; i++) {
          for (let j = i + 1; j < baseFeatures.length; j++) {
            experiments.push({
              id: '',
              experiment_name: `${baseFeatures[i]}_x_${baseFeatures[j]}`,
              feature_type: 'interaction',
              base_features: {
                features: [baseFeatures[i], baseFeatures[j]]
              },
              generated_feature: {
                name: `${baseFeatures[i]}_${baseFeatures[j]}_interaction`,
                description: `Interaction feature: ${baseFeatures[i]} * ${baseFeatures[j]}`
              },
              feature_expression: `${baseFeatures[i]} * ${baseFeatures[j]}`,
              test_start_date: new Date().toISOString(),
              test_end_date: new Date(Date.now() + testDurationDays * 24 * 60 * 60 * 1000).toISOString(),
              sample_size: sampleSize,
              statistical_significance: false,
              is_active: true,
              is_approved: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
          }
        }
        break;
      case 'ratio':
        // Generate ratio features (e.g., x₁ / x₂)
        for (let i = 0; i < baseFeatures.length; i++) {
          for (let j = 0; j < baseFeatures.length; j++) {
            if (i !== j) {
              experiments.push({
                id: '',
                experiment_name: `${baseFeatures[i]}_div_${baseFeatures[j]}`,
                feature_type: 'ratio',
                base_features: {
                  features: [baseFeatures[i], baseFeatures[j]]
                },
                generated_feature: {
                  name: `${baseFeatures[i]}_to_${baseFeatures[j]}_ratio`,
                  description: `Ratio feature: ${baseFeatures[i]} / ${baseFeatures[j]}`
                },
                feature_expression: `${baseFeatures[i]} / (${baseFeatures[j]} + 1)`,
                // +1 to avoid division by zero
                test_start_date: new Date().toISOString(),
                test_end_date: new Date(Date.now() + testDurationDays * 24 * 60 * 60 * 1000).toISOString(),
                sample_size: sampleSize,
                statistical_significance: false,
                is_active: true,
                is_approved: false,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              });
            }
          }
        }
        break;
    }
    return experiments;
  }

  /**
   * Approve a feature for production use
   */
  private static async approveFeature(experimentId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const {
        error
      } = await supabase.from('feature_experiments').update({
        is_approved: true
      }).eq('id', experimentId);
      if (error) throw error;
      return {
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to approve feature'
      };
    }
  }

  /**
   * Calculate model accuracy improvement
   */
  private static async calculateModelImprovement(): Promise<{
    success: boolean;
    improvement?: number;
    error?: string;
  }> {
    try {
      // In a real implementation, this would compare model performance before and after
      // adding approved features. For now, we'll simulate it.

      const {
        data: approvedFeatures,
        error
      } = await supabase.from('feature_experiments').select('improvement_delta').eq('is_approved', true).not('improvement_delta', 'is', null);
      if (error) throw error;
      const totalImprovement = approvedFeatures?.reduce((sum: number, feature: {
        improvement_delta: number | null;
      }) => sum + (feature.improvement_delta || 0), 0) || 0;
      return {
        success: true,
        improvement: totalImprovement
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to calculate model improvement'
      };
    }
  }
}