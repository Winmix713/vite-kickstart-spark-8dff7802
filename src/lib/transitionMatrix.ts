export type Outcome = 'H' | 'D' | 'V'; // Home win, Draw, Away (Vendég) win
export type TransitionMatrix = number[][]; // 3x3 matrix

export interface TransitionData {
  matrix: TransitionMatrix;
  counts: number[][];
  sampleSize: number;
  metadata: {
    team_id?: string;
    period: string;
    confidence: 'low' | 'medium' | 'high';
  };
}
export interface MatchLike {
  id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  match_date?: string;
}

// Extract outcomes from matches relative to a team
export function extractOutcomes(matches: MatchLike[], teamId: string): Outcome[] {
  return matches.map(m => {
    const isHome = m.home_team_id === teamId;
    const teamScore = isHome ? m.home_score ?? 0 : m.away_score ?? 0;
    const oppScore = isHome ? m.away_score ?? 0 : m.home_score ?? 0;
    if (teamScore > oppScore) return 'H';
    if (teamScore < oppScore) return 'V';
    return 'D';
  });
}

// Build a Markov transition matrix with Laplace smoothing (K=3 states)
export function buildTransitionMatrix(outcomes: Outcome[]): TransitionData {
  const idx: Record<Outcome, number> = {
    H: 0,
    D: 1,
    V: 2
  };
  const counts: number[][] = [[0, 0, 0], [0, 0, 0], [0, 0, 0]];
  for (let i = 0; i < outcomes.length - 1; i++) {
    const from = idx[outcomes[i]];
    const to = idx[outcomes[i + 1]];
    counts[from][to]++;
  }
  const K = 3;
  const matrix = counts.map(row => {
    const total = row.reduce((a, b) => a + b, 0);
    return row.map(c => (c + 1) / (total + K));
  });
  const sampleSize = Math.max(0, outcomes.length - 1);
  const confidence: TransitionData['metadata']['confidence'] = sampleSize < 10 ? 'low' : sampleSize < 20 ? 'medium' : 'high';
  return {
    matrix,
    counts,
    sampleSize,
    metadata: {
      period: `last_${outcomes.length}_matches`,
      confidence
    }
  };
}

// Calculate a simple stationary distribution approximation
export function calculateStationaryDistribution(matrix: TransitionMatrix): number[] {
  const n = matrix.length;
  const stationary = new Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      stationary[j] += matrix[i][j];
    }
    stationary[j] /= n;
  }
  return stationary;
}