/**
 * SportRadar API Types
 * Types for external sports data integration
 */

export interface ModelPrediction {
  model_name: string;
  predicted_outcome: string;
  confidence: number;
  reasoning?: string;
}

export interface EnsembleBreakdown {
  models: ModelPrediction[];
  conflict_detected?: boolean;
  max_confidence_difference?: number;
  conflict_margin?: number;
  ensemble_confidence: number;
  ensemble_outcome: string;
  final_confidence?: number;
  voting_pattern?: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  votes?: {
    home_win: number;
    draw: number;
    away_win: number;
  };
  winner?: string;
  weights_used?: Record<string, number>;
  scores?: Record<string, number>;
}

export interface MatchOdds {
  home_win: number;
  draw: number;
  away_win: number;
  bookmaker?: string;
  last_updated?: string;
}

export interface TeamStatistics {
  team_id: string;
  team_name: string;
  recent_form: string;
  goals_scored_avg: number;
  goals_conceded_avg: number;
  win_rate: number;
  home_advantage?: number;
}

export interface MatchContext {
  league: string;
  round?: number;
  importance?: 'low' | 'medium' | 'high';
  weather_conditions?: string;
  injuries?: string[];
}

export interface SportRadarMatch {
  match_id: string;
  home_team: string;
  away_team: string;
  scheduled_time: string;
  venue?: string;
  odds?: MatchOdds;
  context?: MatchContext;
  team_statistics?: {
    home: TeamStatistics;
    away: TeamStatistics;
  };
}
