import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  calculateAverageGoals,
  calculateBothTeamsScoredPercentage,
  calculateExpectedGoals,
  calculateWinProbability,
  generateTeamStatisticsLegacy,
  type MatchResult,
} from "@/lib/teamStatistics";

const sampleMatches: MatchResult[] = [
  { homeTeam: "Team A", awayTeam: "Team B", homeGoals: 2, awayGoals: 1 },
  { homeTeam: "Team A", awayTeam: "Team C", homeGoals: 1, awayGoals: 1 },
  { homeTeam: "Team A", awayTeam: "Team D", homeGoals: 0, awayGoals: 2 },
  { homeTeam: "Team B", awayTeam: "Team D", homeGoals: 3, awayGoals: 3 },
];

describe("teamStatistics calculations", () => {
  beforeEach(() => {
    vi.spyOn(Math, "random").mockReturnValue(0.4);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("calculates the percentage of matches where both teams scored", () => {
    const percentage = calculateBothTeamsScoredPercentage(sampleMatches);
    expect(percentage).toBe(75);
  });

  it("computes average goals correctly", () => {
    const averages = calculateAverageGoals(sampleMatches);
    expect(averages.total).toBeCloseTo(3.5, 1);
    expect(averages.home).toBeCloseTo(1.5, 1);
    expect(averages.away).toBeCloseTo(1.75, 2);
  });

  it("derives expected goals based on recent matches", () => {
    const expectedGoals = calculateExpectedGoals(sampleMatches);
    expect(expectedGoals).toBeCloseTo(1.5, 1);
  });

  it("ensures win probabilities sum to 100", () => {
    const probabilities = calculateWinProbability(sampleMatches);
    const total = probabilities.home + probabilities.draw + probabilities.away;

    expect(total).toBe(100);
    expect(probabilities.home).toBeGreaterThan(0);
    expect(probabilities.away).toBeGreaterThan(0);
  });

  it("generates legacy statistics aggregate", () => {
    const stats = generateTeamStatisticsLegacy(sampleMatches);

    expect(stats.avgGoalsPerMatch).toBeCloseTo(3.5, 1);
    expect(stats.bothTeamsToScoreProb).toBe(75);
    expect(stats.avgHomeGoals).toBeCloseTo(1.5, 1);
    expect(stats.avgAwayGoals).toBeCloseTo(1.75, 2);
  });
});
