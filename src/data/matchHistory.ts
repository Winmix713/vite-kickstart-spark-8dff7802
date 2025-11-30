import { MatchResult } from "@/lib/teamStatistics";

// Mock match history data for all teams
export const matchHistory: Record<string, MatchResult[]> = {
  "Aston Oroszlán": [{
    date: "2024-10-20",
    opponent: "Chelsea",
    homeGoals: 2,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-10-13",
    opponent: "Brighton",
    homeGoals: 1,
    awayGoals: 1,
    isHome: false,
    result: 'D'
  }, {
    date: "2024-10-06",
    opponent: "Manchester Kék",
    homeGoals: 3,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-29",
    opponent: "Liverpool",
    homeGoals: 2,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-22",
    opponent: "Brentford",
    homeGoals: 0,
    awayGoals: 2,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-09-15",
    opponent: "Tottenham",
    homeGoals: 2,
    awayGoals: 2,
    isHome: true,
    result: 'D'
  }, {
    date: "2024-09-08",
    opponent: "Arsenal",
    homeGoals: 1,
    awayGoals: 0,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-09-01",
    opponent: "Newcastle",
    homeGoals: 3,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-08-25",
    opponent: "West Ham",
    homeGoals: 1,
    awayGoals: 1,
    isHome: false,
    result: 'D'
  }, {
    date: "2024-08-18",
    opponent: "Everton",
    homeGoals: 2,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }],
  "Brentford": [{
    date: "2024-10-20",
    opponent: "Arsenal",
    homeGoals: 1,
    awayGoals: 2,
    isHome: true,
    result: 'L'
  }, {
    date: "2024-10-13",
    opponent: "Tottenham",
    homeGoals: 2,
    awayGoals: 1,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-10-06",
    opponent: "Chelsea",
    homeGoals: 0,
    awayGoals: 0,
    isHome: true,
    result: 'D'
  }, {
    date: "2024-09-29",
    opponent: "Brighton",
    homeGoals: 3,
    awayGoals: 2,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-22",
    opponent: "Aston Oroszlán",
    homeGoals: 2,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-15",
    opponent: "Liverpool",
    homeGoals: 1,
    awayGoals: 3,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-09-08",
    opponent: "Manchester Kék",
    homeGoals: 1,
    awayGoals: 1,
    isHome: true,
    result: 'D'
  }, {
    date: "2024-09-01",
    opponent: "Everton",
    homeGoals: 2,
    awayGoals: 1,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-08-25",
    opponent: "Newcastle",
    homeGoals: 0,
    awayGoals: 1,
    isHome: true,
    result: 'L'
  }, {
    date: "2024-08-18",
    opponent: "West Ham",
    homeGoals: 2,
    awayGoals: 2,
    isHome: false,
    result: 'D'
  }],
  "Brighton": [{
    date: "2024-10-20",
    opponent: "Liverpool",
    homeGoals: 2,
    awayGoals: 3,
    isHome: true,
    result: 'L'
  }, {
    date: "2024-10-13",
    opponent: "Aston Oroszlán",
    homeGoals: 1,
    awayGoals: 1,
    isHome: true,
    result: 'D'
  }, {
    date: "2024-10-06",
    opponent: "Newcastle",
    homeGoals: 3,
    awayGoals: 1,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-09-29",
    opponent: "Brentford",
    homeGoals: 2,
    awayGoals: 3,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-09-22",
    opponent: "Tottenham",
    homeGoals: 2,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-15",
    opponent: "Chelsea",
    homeGoals: 1,
    awayGoals: 2,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-09-08",
    opponent: "Everton",
    homeGoals: 3,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-01",
    opponent: "Arsenal",
    homeGoals: 1,
    awayGoals: 1,
    isHome: false,
    result: 'D'
  }, {
    date: "2024-08-25",
    opponent: "Manchester Kék",
    homeGoals: 0,
    awayGoals: 2,
    isHome: true,
    result: 'L'
  }, {
    date: "2024-08-18",
    opponent: "West Ham",
    homeGoals: 2,
    awayGoals: 0,
    isHome: false,
    result: 'W'
  }],
  "Chelsea": [{
    date: "2024-10-20",
    opponent: "Aston Oroszlán",
    homeGoals: 1,
    awayGoals: 2,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-10-13",
    opponent: "Arsenal",
    homeGoals: 2,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-10-06",
    opponent: "Brentford",
    homeGoals: 0,
    awayGoals: 0,
    isHome: false,
    result: 'D'
  }, {
    date: "2024-09-29",
    opponent: "Tottenham",
    homeGoals: 3,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-22",
    opponent: "Manchester Kék",
    homeGoals: 2,
    awayGoals: 1,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-09-15",
    opponent: "Brighton",
    homeGoals: 2,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-08",
    opponent: "Liverpool",
    homeGoals: 1,
    awayGoals: 3,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-09-01",
    opponent: "West Ham",
    homeGoals: 3,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-08-25",
    opponent: "Newcastle",
    homeGoals: 2,
    awayGoals: 2,
    isHome: false,
    result: 'D'
  }, {
    date: "2024-08-18",
    opponent: "Everton",
    homeGoals: 4,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }],
  "Liverpool": [{
    date: "2024-10-20",
    opponent: "Brighton",
    homeGoals: 3,
    awayGoals: 2,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-10-13",
    opponent: "Manchester Kék",
    homeGoals: 2,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-10-06",
    opponent: "Arsenal",
    homeGoals: 3,
    awayGoals: 1,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-09-29",
    opponent: "Aston Oroszlán",
    homeGoals: 1,
    awayGoals: 2,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-09-22",
    opponent: "Tottenham",
    homeGoals: 4,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-15",
    opponent: "Brentford",
    homeGoals: 3,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-08",
    opponent: "Chelsea",
    homeGoals: 3,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-01",
    opponent: "Newcastle",
    homeGoals: 2,
    awayGoals: 1,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-08-25",
    opponent: "Everton",
    homeGoals: 3,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-08-18",
    opponent: "West Ham",
    homeGoals: 2,
    awayGoals: 0,
    isHome: false,
    result: 'W'
  }],
  "Manchester Kék": [{
    date: "2024-10-20",
    opponent: "Tottenham",
    homeGoals: 2,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-10-13",
    opponent: "Liverpool",
    homeGoals: 0,
    awayGoals: 2,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-10-06",
    opponent: "Aston Oroszlán",
    homeGoals: 0,
    awayGoals: 3,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-09-29",
    opponent: "Arsenal",
    homeGoals: 1,
    awayGoals: 1,
    isHome: true,
    result: 'D'
  }, {
    date: "2024-09-22",
    opponent: "Chelsea",
    homeGoals: 1,
    awayGoals: 2,
    isHome: true,
    result: 'L'
  }, {
    date: "2024-09-15",
    opponent: "West Ham",
    homeGoals: 3,
    awayGoals: 1,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-09-08",
    opponent: "Brentford",
    homeGoals: 1,
    awayGoals: 1,
    isHome: false,
    result: 'D'
  }, {
    date: "2024-09-01",
    opponent: "Brighton",
    homeGoals: 2,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-08-25",
    opponent: "Everton",
    homeGoals: 3,
    awayGoals: 0,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-08-18",
    opponent: "Newcastle",
    homeGoals: 2,
    awayGoals: 2,
    isHome: true,
    result: 'D'
  }],
  "Barcelona": [{
    date: "2024-10-20",
    opponent: "Madrid Fehér",
    homeGoals: 2,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-10-13",
    opponent: "Sevilla",
    homeGoals: 3,
    awayGoals: 0,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-10-06",
    opponent: "Valencia",
    homeGoals: 2,
    awayGoals: 2,
    isHome: true,
    result: 'D'
  }, {
    date: "2024-09-29",
    opponent: "Atletico Madrid",
    homeGoals: 3,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-22",
    opponent: "Bilbao",
    homeGoals: 1,
    awayGoals: 0,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-09-15",
    opponent: "Betis",
    homeGoals: 4,
    awayGoals: 2,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-08",
    opponent: "Getafe",
    homeGoals: 2,
    awayGoals: 1,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-09-01",
    opponent: "Villarreal",
    homeGoals: 3,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-08-25",
    opponent: "Sociedad",
    homeGoals: 1,
    awayGoals: 1,
    isHome: false,
    result: 'D'
  }, {
    date: "2024-08-18",
    opponent: "Osasuna",
    homeGoals: 2,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }],
  "Madrid Fehér": [{
    date: "2024-10-20",
    opponent: "Barcelona",
    homeGoals: 1,
    awayGoals: 2,
    isHome: false,
    result: 'L'
  }, {
    date: "2024-10-13",
    opponent: "Atletico Madrid",
    homeGoals: 3,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-10-06",
    opponent: "Sevilla",
    homeGoals: 2,
    awayGoals: 0,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-09-29",
    opponent: "Valencia",
    homeGoals: 4,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-22",
    opponent: "Betis",
    homeGoals: 2,
    awayGoals: 1,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-09-15",
    opponent: "Villarreal",
    homeGoals: 3,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-09-08",
    opponent: "Sociedad",
    homeGoals: 2,
    awayGoals: 2,
    isHome: false,
    result: 'D'
  }, {
    date: "2024-09-01",
    opponent: "Bilbao",
    homeGoals: 3,
    awayGoals: 1,
    isHome: true,
    result: 'W'
  }, {
    date: "2024-08-25",
    opponent: "Getafe",
    homeGoals: 1,
    awayGoals: 0,
    isHome: false,
    result: 'W'
  }, {
    date: "2024-08-18",
    opponent: "Osasuna",
    homeGoals: 3,
    awayGoals: 0,
    isHome: true,
    result: 'W'
  }]
};

// Generate realistic match history for teams without explicit data
export const generateMatchHistory = (teamName: string, overallRating: number): MatchResult[] => {
  const opponents = ["Team A", "Team B", "Team C", "Team D", "Team E", "Team F", "Team G", "Team H", "Team I", "Team J"];
  const matches: MatchResult[] = [];
  const winRate = overallRating / 100;
  for (let i = 0; i < 10; i++) {
    const isHome = i % 2 === 0;
    const random = Math.random();
    let result: 'W' | 'D' | 'L';
    let homeGoals: number;
    let awayGoals: number;
    if (random < winRate * 0.6) {
      result = 'W';
      if (isHome) {
        homeGoals = Math.floor(Math.random() * 3) + 1;
        awayGoals = Math.floor(Math.random() * homeGoals);
      } else {
        awayGoals = Math.floor(Math.random() * 3) + 1;
        homeGoals = Math.floor(Math.random() * awayGoals);
      }
    } else if (random < winRate * 0.8) {
      result = 'D';
      const goals = Math.floor(Math.random() * 3);
      homeGoals = goals;
      awayGoals = goals;
    } else {
      result = 'L';
      if (isHome) {
        awayGoals = Math.floor(Math.random() * 3) + 1;
        homeGoals = Math.floor(Math.random() * awayGoals);
      } else {
        homeGoals = Math.floor(Math.random() * 3) + 1;
        awayGoals = Math.floor(Math.random() * homeGoals);
      }
    }
    const date = new Date();
    date.setDate(date.getDate() - i * 7);
    matches.push({
      date: date.toISOString().split('T')[0],
      opponent: opponents[i],
      homeGoals,
      awayGoals,
      isHome,
      result
    });
  }
  return matches;
};
export const getMatchHistory = ({
  league,
  team
}: {
  league?: string;
  team?: string;
}): Promise<MatchResult[]> => {
  // TODO: Wire real data source from Supabase based on league/team filters
  return Promise.resolve(team ? matchHistory[team] || generateMatchHistory(team, 75) : []);
};