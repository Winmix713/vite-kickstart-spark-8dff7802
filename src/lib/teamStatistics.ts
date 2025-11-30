// Statistical calculation functions for team analysis

export interface MatchResult {
  homeTeam: string;
  awayTeam: string;
  homeGoals: number;
  awayGoals: number;
  date?: string;
}
export interface TeamStatistics {
  bothTeamsScored: number;
  avgGoalsPerMatch: number;
  avgHomeGoals: number;
  avgAwayGoals: number;
  formIndex: number;
  expectedGoals: number;
  bothTeamsToScoreProb: number;
  winProbability: {
    home: number;
    draw: number;
    away: number;
  };
}

// Calculate percentage of matches where both teams scored
export const calculateBothTeamsScoredPercentage = (matches: MatchResult[]): number => {
  if (matches.length === 0) return 0;
  const bothScored = matches.filter(match => match.homeGoals > 0 && match.awayGoals > 0).length;
  return Math.round(bothScored / matches.length * 100);
};

// Calculate average goals per match
export const calculateAverageGoals = (matches: MatchResult[]) => {
  if (matches.length === 0) return {
    total: 0,
    home: 0,
    away: 0
  };
  let totalGoals = 0;
  let homeGoals = 0;
  let awayGoals = 0;
  let homeMatches = 0;
  let awayMatches = 0;
  matches.forEach(match => {
    totalGoals += match.homeGoals + match.awayGoals;
    // Note: This is a simplified approach - in real implementation we'd need team context
    homeGoals += match.homeGoals;
    awayGoals += match.awayGoals;
    homeMatches++;
    awayMatches++;
  });
  return {
    total: Number((totalGoals / matches.length).toFixed(2)),
    home: homeMatches > 0 ? Number((homeGoals / homeMatches).toFixed(2)) : 0,
    away: awayMatches > 0 ? Number((awayGoals / awayMatches).toFixed(2)) : 0
  };
};

// Calculate form index based on last 5 matches
export const calculateFormIndex = (matches: MatchResult[]): number => {
  const recentMatches = matches.slice(0, 5);
  if (recentMatches.length === 0) return 0;

  // Simplified form calculation - in real implementation we'd need match results
  const points = Math.floor(Math.random() * recentMatches.length * 3); // Placeholder

  const maxPoints = recentMatches.length * 3;
  return Math.round(points / maxPoints * 100);
};

// Calculate expected goals (xG)
export const calculateExpectedGoals = (matches: MatchResult[]): number => {
  if (matches.length === 0) return 0;
  const teamGoals = matches.map(match => match.homeGoals); // Simplified

  const avgGoals = teamGoals.reduce((sum, goals) => sum + goals, 0) / teamGoals.length;
  return Number(avgGoals.toFixed(2));
};

// Calculate probability of both teams scoring
export const calculateBothTeamsToScoreProb = (matches: MatchResult[]): number => {
  return calculateBothTeamsScoredPercentage(matches);
};

// Calculate win probability using Elo-inspired model
export const calculateWinProbability = (matches: MatchResult[]): {
  home: number;
  draw: number;
  away: number;
} => {
  if (matches.length === 0) return {
    home: 33,
    draw: 34,
    away: 33
  };

  // Simplified probability calculation
  const formIndex = calculateFormIndex(matches);
  const adjustment = (formIndex - 50) / 2;
  let home = Math.max(20, Math.min(60, 50 + adjustment));
  let away = Math.max(15, Math.min(50, 50 - adjustment));
  let draw = 100 - home - away;

  // Normalize to ensure sum is 100
  const total = home + draw + away;
  home = Math.round(home / total * 100);
  away = Math.round(away / total * 100);
  draw = 100 - home - away;
  return {
    home,
    draw,
    away
  };
};

// Generate comprehensive team statistics
export const generateTeamStatistics = (results: MatchResult[]): {
  team: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  points: number;
}[] => {
  // TODO: Implement proper team statistics aggregation from match results
  // For now, return sample data for demonstration
  return [{
    team: "Manchester City",
    played: 10,
    wins: 8,
    draws: 1,
    losses: 1,
    goalsFor: 24,
    goalsAgainst: 8,
    points: 25
  }, {
    team: "Liverpool",
    played: 10,
    wins: 7,
    draws: 2,
    losses: 1,
    goalsFor: 20,
    goalsAgainst: 9,
    points: 23
  }, {
    team: "Arsenal",
    played: 10,
    wins: 6,
    draws: 3,
    losses: 1,
    goalsFor: 18,
    goalsAgainst: 10,
    points: 21
  }];
};

// Calculate head-to-head statistics between two teams
export const calculateHeadToHeadStats = (a: string, b: string, results: MatchResult[]): {
  meetings: number;
  aWins: number;
  bWins: number;
  draws: number;
  aGoals: number;
  bGoals: number;
} => {
  // TODO: Implement proper head-to-head calculation
  // For now, return placeholder data
  return {
    meetings: 0,
    aWins: 0,
    bWins: 0,
    draws: 0,
    aGoals: 0,
    bGoals: 0
  };
};

// Calculate Poisson-based goal prediction
export const calculatePoissonGoals = (avgGoalsFor: number, avgGoalsAgainst: number): number => {
  // TODO: Implement proper Poisson distribution calculation
  // For now, return simple average
  return Math.round((avgGoalsFor + avgGoalsAgainst) / 2);
};

// Predict winner based on historical data
export const predictWinner = (a: string, b: string, results: MatchResult[]): {
  winner: string | null;
  confidence: number;
} => {
  // TODO: Implement proper winner prediction algorithm
  // For now, return null with low confidence
  return {
    winner: null,
    confidence: 0.5
  };
};

// Generate comprehensive team statistics (legacy interface)
export const generateTeamStatisticsLegacy = (matches: MatchResult[]): TeamStatistics => {
  return {
    bothTeamsScored: calculateBothTeamsScoredPercentage(matches),
    avgGoalsPerMatch: calculateAverageGoals(matches).total,
    avgHomeGoals: calculateAverageGoals(matches).home,
    avgAwayGoals: calculateAverageGoals(matches).away,
    formIndex: calculateFormIndex(matches),
    expectedGoals: calculateExpectedGoals(matches),
    bothTeamsToScoreProb: calculateBothTeamsToScoreProb(matches),
    winProbability: calculateWinProbability(matches)
  };
};