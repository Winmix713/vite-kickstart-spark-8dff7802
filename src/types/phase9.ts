// Phase 9: Advanced Features Types

// 9.1 Collaborative Intelligence Types
export interface UserPrediction {
  id: string;
  match_id: string;
  user_id: string;
  predicted_outcome: 'home_win' | 'draw' | 'away_win';
  confidence_score: number; // 0-100
  predicted_home_score?: number;
  predicted_away_score?: number;
  btts_prediction?: boolean;
  over_under_prediction?: 'over_2.5' | 'under_2.5';
  reasoning?: string;
  created_at: string;
  updated_at: string;
}
export interface CrowdWisdom {
  id: string;
  match_id: string;
  total_predictions: number;
  home_win_predictions: number;
  draw_predictions: number;
  away_win_predictions: number;
  average_confidence: number;
  consensus_prediction?: 'home_win' | 'draw' | 'away_win';
  consensus_confidence: number;
  model_vs_crowd_divergence: number;
  last_calculated_at: string;
  created_at: string;
  updated_at: string;
}
export interface UserPredictionForm {
  match_id: string;
  predicted_outcome: 'home_win' | 'draw' | 'away_win';
  confidence_score: number;
  predicted_home_score?: number;
  predicted_away_score?: number;
  btts_prediction?: boolean;
  over_under_prediction?: 'over_2.5' | 'under_2.5';
  reasoning?: string;
}
export interface UserPredictionResponse {
  success: boolean;
  prediction?: UserPrediction;
  error?: string;
}
export interface CrowdWisdomResponse {
  success: boolean;
  crowdWisdom?: CrowdWisdom;
  error?: string;
}

// 9.2 Market Integration Types
export interface MarketOdds {
  id: string;
  match_id: string;
  bookmaker: string;
  home_win_odds: number;
  draw_odds: number;
  away_win_odds: number;
  over_2_5_odds?: number;
  under_2_5_odds?: number;
  btts_yes_odds?: number;
  btts_no_odds?: number;
  last_updated: string;
  api_source: string;
  raw_response?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}
export interface ValueBet {
  id: string;
  match_id: string;
  bookmaker: string;
  bet_type: 'home_win' | 'draw' | 'away_win' | 'over_2_5' | 'under_2_5' | 'btts_yes' | 'btts_no';
  bookmaker_odds: number;
  model_probability: number; // 0-1
  implied_probability: number; // 0-1
  expected_value: number; // EV
  kelly_fraction: number; // 0-1
  confidence_level: 'low' | 'medium' | 'high';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
export interface MarketOddsResponse {
  success: boolean;
  odds?: MarketOdds[];
  error?: string;
}
export interface ValueBetsResponse {
  success: boolean;
  valueBets?: ValueBet[];
  error?: string;
}

// External API types for odds integration
export interface OddsAPIResponse {
  success: boolean;
  data?: {
    match_id: string;
    bookmakers: Array<{
      name: string;
      bets: {
        name: string;
        values: Array<{
          value: number;
          odd: number;
        }>;
      }[];
    }>;
  };
  error?: string;
}
export interface OddsAPICredentials {
  apiKey: string;
  baseUrl: string;
  rateLimitPerHour: number;
}

// 9.3 Temporal Decay Types
export interface InformationFreshness {
  id: string;
  table_name: string;
  record_id: string;
  data_type: 'match' | 'team_stats' | 'pattern' | 'odds' | 'user_prediction';
  last_updated: string;
  decay_rate: number; // e.g., 0.1 = 10% per day
  freshness_score: number; // 0-1
  is_stale: boolean;
  stale_threshold_days: number;
  created_at: string;
  updated_at: string;
}
export interface FreshnessCalculationParams {
  last_updated: string;
  decay_rate: number;
  current_time?: string;
}
export interface FreshnessScoreResponse {
  success: boolean;
  freshness_score?: number;
  is_stale?: boolean;
  error?: string;
}
export interface StaleDataCheckResponse {
  success: boolean;
  staleRecords?: InformationFreshness[];
  refreshedCount?: number;
  error?: string;
}

// 9.4 Self-Improving System Types
export interface FeatureExperiment {
  id: string;
  experiment_name: string;
  feature_type: 'polynomial' | 'interaction' | 'ratio' | 'temporal' | 'aggregate';
  base_features: Record<string, unknown>;
  generated_feature: Record<string, unknown>;
  feature_expression: string;
  test_start_date: string;
  test_end_date?: string;
  sample_size: number;
  control_accuracy?: number;
  test_accuracy?: number;
  improvement_delta?: number;
  statistical_significance: boolean;
  p_value?: number;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}
export interface FeatureGenerationRequest {
  feature_types: ('polynomial' | 'interaction' | 'ratio' | 'temporal' | 'aggregate')[];
  base_features: string[];
  sample_size?: number;
  test_duration_days?: number;
}
export interface FeatureGenerationResponse {
  success: boolean;
  experiments?: FeatureExperiment[];
  error?: string;
}
export interface FeatureTestResult {
  experiment_id: string;
  control_accuracy: number;
  test_accuracy: number;
  improvement_delta: number;
  p_value: number;
  statistical_significance: boolean;
  recommendation: 'approve' | 'reject' | 'continue_testing';
}
export interface ContinuousLearningResponse {
  success: boolean;
  results?: {
    experimentsGenerated: number;
    experimentsCompleted: number;
    featuresApproved: number;
    modelAccuracyImprovement: number;
  };
  error?: string;
}

// API Request/Response types for Phase 9 endpoints
export interface Phase9APIEndpoints {
  // Collaborative Intelligence
  'POST /api/predictions/user': UserPredictionResponse;
  'GET /api/predictions/crowd/:matchId': CrowdWisdomResponse;

  // Market Integration
  'GET /api/market/odds/:matchId': MarketOddsResponse;
  'GET /api/market/value-bets': ValueBetsResponse;

  // Temporal Decay
  'POST /api/temporal/freshness': FreshnessScoreResponse;
  'POST /api/temporal/check-stale': StaleDataCheckResponse;

  // Self-Improving System
  'POST /api/self-improving/generate-features': FeatureGenerationResponse;
  'POST /api/self-improving/test-feature': {
    success: boolean;
    result?: FeatureTestResult;
    error?: string;
  };
  'POST /api/self-improving/continuous-learning': ContinuousLearningResponse;
}

// UI Component Props Types
export interface UserPredictionFormProps {
  matchId: string;
  onSubmit: (prediction: UserPredictionForm) => void;
  isLoading?: boolean;
  disabled?: boolean;
}
export interface CrowdWisdomDisplayProps {
  matchId: string;
  showDivergence?: boolean;
  refreshInterval?: number;
}
export interface MarketOddsDisplayProps {
  matchId: string;
  showValueBets?: boolean;
  autoRefresh?: boolean;
}
export interface ValueBetHighlightsProps {
  maxResults?: number;
  minExpectedValue?: number;
  showKellyCalculator?: boolean;
}
export interface FreshnessIndicatorProps {
  tableName: string;
  recordId: string;
  dataType: string;
  showDetails?: boolean;
}
export interface ExperimentDashboardProps {
  showActiveOnly?: boolean;
  autoRefresh?: boolean;
}

// Utility types for calculations
export interface ExpectedValueCalculation {
  odds: number;
  modelProbability: number;
  expectedValue: number;
  kellyFraction: number;
  recommendation: 'bet' | 'skip' | 'consider';
}
export interface DivergenceAnalysis {
  modelPrediction: string;
  modelConfidence: number;
  crowdConsensus: string;
  crowdConfidence: number;
  divergence: number;
  interpretation: 'high' | 'medium' | 'low';
  recommendation: string;
}
export interface TemporalDecayConfig {
  defaultDecayRate: number;
  dataTypes: Record<string, {
    decayRate: number;
    staleThresholdDays: number;
  }>;
}
export interface FeatureEngineeringConfig {
  maxPolynomialDegree: number;
  maxInteractionTerms: number;
  minSampleSize: number;
  significanceThreshold: number;
  maxConcurrentExperiments: number;
}

// Error types
export interface Phase9Error {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}
export interface APIError extends Phase9Error {
  endpoint: string;
  statusCode: number;
}
export interface ValidationError extends Phase9Error {
  field: string;
  value: unknown;
}

// Success types for optimistic updates
export interface OptimisticUpdateResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  rollback?: () => void;
}

// Cache and performance types
export interface CacheConfig {
  ttl: number; // seconds
  maxSize: number;
  strategy: 'lru' | 'fifo' | 'lfu';
}
export interface PerformanceMetrics {
  responseTime: number;
  cacheHitRate: number;
  errorRate: number;
  throughput: number;
}

// Types are exported at their definitions above