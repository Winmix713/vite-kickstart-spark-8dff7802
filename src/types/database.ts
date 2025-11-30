export interface League {
  id: string;
  season_number: number;
  league_type: 'angol' | 'spanyol';
  uploaded_at: string;
  match_count: number;
}
export interface Match {
  id: string;
  league_id: string;
  match_time: string;
  home_team: string;
  away_team: string;
  half_time_home_goals: number;
  half_time_away_goals: number;
  full_time_home_goals: number;
  full_time_away_goals: number;
  created_at: string;
}
export interface TeamStatistics {
  success: boolean;
  team_analysis: {
    both_teams_scored_percentage: number;
    average_goals: {
      average_total_goals: number;
      average_home_goals: number;
      average_away_goals: number;
    };
    home_form_index: number;
    away_form_index: number;
    expected_goals: number;
    head_to_head_stats: {
      home_win_percentage: number;
      draw_percentage: number;
      away_win_percentage: number;
    };
  };
  prediction: {
    homeExpectedGoals: number;
    awayExpectedGoals: number;
    bothTeamsToScoreProb: number;
    predictedWinner: 'home' | 'away' | 'draw';
    confidence: number;
    modelPredictions: {
      poisson: {
        homeGoals: number;
        awayGoals: number;
      };
      elo: {
        homeWinProb: number;
        drawProb: number;
        awayWinProb: number;
      };
    };
  };
  matches: Match[];
}