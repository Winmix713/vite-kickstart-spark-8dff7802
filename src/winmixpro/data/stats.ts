export const winmixStatLeagues = ["Premier League", "Serie A", "NB I"] as const;
export const winmixStatRanges = ["Utolsó 5 forduló", "30 nap", "Szezon"] as const;
export type WinmixLeague = (typeof winmixStatLeagues)[number];
export const winmixGoalDistributions: Record<WinmixLeague, Array<{
  range: string;
  matches: number;
}>> = {
  "Premier League": [{
    range: "0-1 gól",
    matches: 6
  }, {
    range: "2-3 gól",
    matches: 14
  }, {
    range: "4-5 gól",
    matches: 5
  }, {
    range: "6+ gól",
    matches: 1
  }],
  "Serie A": [{
    range: "0-1 gól",
    matches: 5
  }, {
    range: "2-3 gól",
    matches: 11
  }, {
    range: "4-5 gól",
    matches: 4
  }, {
    range: "6+ gól",
    matches: 0
  }],
  "NB I": [{
    range: "0-1 gól",
    matches: 4
  }, {
    range: "2-3 gól",
    matches: 9
  }, {
    range: "4-5 gól",
    matches: 3
  }, {
    range: "6+ gól",
    matches: 1
  }]
};
export const winmixScorelineLeaders: Record<WinmixLeague, Array<{
  scoreline: string;
  count: number;
  trend: number;
}>> = {
  "Premier League": [{
    scoreline: "2-1",
    count: 5,
    trend: 1
  }, {
    scoreline: "1-1",
    count: 4,
    trend: -1
  }, {
    scoreline: "3-1",
    count: 3,
    trend: 0
  }],
  "Serie A": [{
    scoreline: "1-0",
    count: 6,
    trend: 2
  }, {
    scoreline: "2-0",
    count: 3,
    trend: 0
  }, {
    scoreline: "1-1",
    count: 3,
    trend: -1
  }],
  "NB I": [{
    scoreline: "2-1",
    count: 4,
    trend: 1
  }, {
    scoreline: "3-2",
    count: 2,
    trend: 1
  }, {
    scoreline: "1-0",
    count: 2,
    trend: 0
  }]
};
export interface WinmixQualityFlag {
  id: string;
  league: WinmixLeague;
  description: string;
  severity: "medium" | "high";
}
export const winmixQualityFlags: WinmixQualityFlag[] = [{
  id: "flag-1",
  league: "Premier League",
  description: "Chelsea - Spurs mérkőzéshez hiányzó piaci odds.",
  severity: "high"
}, {
  id: "flag-2",
  league: "Serie A",
  description: "1-1 scoreline duplikáció az Empoli meccssorban.",
  severity: "medium"
}];