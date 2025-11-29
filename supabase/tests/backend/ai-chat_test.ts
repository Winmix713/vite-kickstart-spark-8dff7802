// Tests for the AI Chat Edge Function
// Run with: supabase test db ai-chat_test

import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("AI Chat - Team name extraction patterns", () => {
  // Test data for team name extraction
  const testCases = [
    {
      input: "Real Madrid vs Barcelona",
      expected: { home: "Real Madrid", away: "Barcelona" }
    },
    {
      input: "Liverpool against Manchester United",
      expected: { home: "Liverpool", away: "Manchester United" }
    },
    {
      input: "Arsenal and Chelsea",
      expected: { home: "Arsenal", away: "Chelsea" }
    },
    {
      input: "no teams here",
      expected: { home: undefined, away: undefined }
    }
  ];

  testCases.forEach(({ input, expected }) => {
    // Pattern matching logic (simplified version of Edge Function logic)
    const patterns = [
      /(.+?)\s+vs\s+(.+?)(?:\s|$|\.)/i,
      /(.+?)\s+against\s+(.+?)(?:\s|$|\.)/i,
      /(.+?)\s+and\s+(.+?)(?:\s|$|\.)/i,
    ];

    let result = { home: undefined, away: undefined };
    for (const pattern of patterns) {
      const match = input.match(pattern);
      if (match) {
        result = {
          home: match[1].trim(),
          away: match[2].trim()
        };
        break;
      }
    }

    assertEquals(result.home, expected.home, `Failed for: ${input}`);
    assertEquals(result.away, expected.away, `Failed for: ${input}`);
  });
});

Deno.test("AI Chat - Form score calculation", () => {
  interface Match {
    home_team_id: string;
    away_team_id: string;
    home_score: number;
    away_score: number;
  }

  const calculateFormScore = (matches: Match[], teamId: string): number => {
    if (matches.length === 0) return 50;

    let score = 0;
    matches.forEach((match) => {
      const isHome = match.home_team_id === teamId;
      const teamScore = isHome ? match.home_score : match.away_score;
      const opponentScore = isHome ? match.away_score : match.home_score;

      if (teamScore > opponentScore) score += 20;
      else if (teamScore === opponentScore) score += 10;
    });

    return Math.min(score, 100);
  };

  // Test case 1: All wins (5 matches)
  const winMatches: Match[] = [
    { home_team_id: "team1", away_team_id: "team2", home_score: 2, away_score: 1 },
    { home_team_id: "team1", away_team_id: "team3", home_score: 3, away_score: 0 },
    { home_team_id: "team4", away_team_id: "team1", home_score: 1, away_score: 2 },
    { home_team_id: "team1", away_team_id: "team5", home_score: 1, away_score: 0 },
    { home_team_id: "team6", away_team_id: "team1", home_score: 0, away_score: 1 }
  ];
  const winScore = calculateFormScore(winMatches, "team1");
  assertEquals(winScore, 100, "All wins should give score of 100");

  // Test case 2: All losses
  const lossMatches: Match[] = [
    { home_team_id: "team1", away_team_id: "team2", home_score: 0, away_score: 1 },
    { home_team_id: "team1", away_team_id: "team3", home_score: 1, away_score: 2 }
  ];
  const lossScore = calculateFormScore(lossMatches, "team1");
  assertEquals(lossScore, 50, "All losses should give score of 50");

  // Test case 3: Draws
  const drawMatches: Match[] = [
    { home_team_id: "team1", away_team_id: "team2", home_score: 1, away_score: 1 },
    { home_team_id: "team1", away_team_id: "team3", home_score: 0, away_score: 0 }
  ];
  const drawScore = calculateFormScore(drawMatches, "team1");
  assertEquals(drawScore, 50, "2 draws should give score of 50");

  // Test case 4: Empty matches
  const emptyScore = calculateFormScore([], "team1");
  assertEquals(emptyScore, 50, "No matches should give neutral score of 50");
});

Deno.test("AI Chat - H2H match analysis", () => {
  interface Match {
    home_team_id: string;
    away_team_id: string;
    home_score: number;
    away_score: number;
  }

  const analyzeH2H = (matches: Match[], homeTeamId: string, awayTeamId: string) => {
    let homeWins = 0;
    let awayWins = 0;

    matches.forEach((match) => {
      if (match.home_team_id === homeTeamId) {
        if (match.home_score > match.away_score) homeWins++;
        else if (match.away_score > match.home_score) awayWins++;
      } else {
        if (match.away_score > match.home_score) homeWins++;
        else if (match.home_score > match.away_score) awayWins++;
      }
    });

    return { homeWins, awayWins };
  };

  const h2hMatches: Match[] = [
    { home_team_id: "team1", away_team_id: "team2", home_score: 2, away_score: 1 },
    { home_team_id: "team2", away_team_id: "team1", home_score: 1, away_score: 1 },
    { home_team_id: "team1", away_team_id: "team2", home_score: 3, away_score: 0 }
  ];

  const result = analyzeH2H(h2hMatches, "team1", "team2");
  assertEquals(result.homeWins, 2, "Team 1 should have 2 wins in H2H");
  assertEquals(result.awayWins, 0, "Team 2 should have 0 wins in H2H against Team 1");
});

Deno.test("AI Chat - Request validation", () => {
  interface ChatRequest {
    message: string;
    context?: Record<string, unknown>;
  }

  const validateRequest = (request: ChatRequest): boolean => {
    if (!request.message || typeof request.message !== 'string') {
      return false;
    }
    if (request.message.trim().length === 0) {
      return false;
    }
    if (request.message.length > 1000) {
      return false;
    }
    return true;
  };

  // Valid requests
  assertEquals(validateRequest({ message: "Real Madrid vs Barcelona" }), true);
  assertEquals(validateRequest({ message: "Short message" }), true);

  // Invalid requests
  assertEquals(validateRequest({ message: "" }), false);
  assertEquals(validateRequest({ message: "   " }), false);
  assertEquals(validateRequest({ message: "a".repeat(1001) }), false);
  // @ts-expect-error - Testing invalid input
  assertEquals(validateRequest({ message: null }), false);
});
