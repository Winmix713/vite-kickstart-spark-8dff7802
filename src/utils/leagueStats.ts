import type { Match, TeamStats, StandingsEntry } from "@/types/league.types";
const MAX_FORM_ENTRIES = 5;
const createInitialTeamStats = (team: string): TeamStats => ({
  team,
  played: 0,
  won: 0,
  drawn: 0,
  lost: 0,
  goalsFor: 0,
  goalsAgainst: 0,
  goalDifference: 0,
  points: 0,
  form: []
});
export class LeagueStatsCalculator {
  private teamStats: Map<string, TeamStats>;
  constructor(private matches: Match[]) {
    this.teamStats = new Map();
    this.processMatches();
  }
  private ensureTeamExists(team: string): void {
    if (!this.teamStats.has(team)) {
      this.teamStats.set(team, createInitialTeamStats(team));
    }
  }
  private updateTeamStats(team: string, goalsFor: number, goalsAgainst: number, result: "W" | "D" | "L"): void {
    const stats = this.teamStats.get(team)!;
    stats.played++;
    stats.goalsFor += goalsFor;
    stats.goalsAgainst += goalsAgainst;
    stats.goalDifference = stats.goalsFor - stats.goalsAgainst;
    switch (result) {
      case "W":
        stats.won++;
        stats.points += 3;
        break;
      case "D":
        stats.drawn++;
        stats.points++;
        break;
      case "L":
        stats.lost++;
        break;
    }
    stats.form.push(result);
    if (stats.form.length > MAX_FORM_ENTRIES) {
      stats.form = stats.form.slice(-MAX_FORM_ENTRIES);
    }
  }
  private processMatches(): void {
    for (const match of this.matches) {
      try {
        const {
          home_team,
          away_team,
          full_time_home_goals,
          full_time_away_goals
        } = match;
        this.ensureTeamExists(home_team);
        this.ensureTeamExists(away_team);
        if (full_time_home_goals > full_time_away_goals) {
          this.updateTeamStats(home_team, full_time_home_goals, full_time_away_goals, "W");
          this.updateTeamStats(away_team, full_time_away_goals, full_time_home_goals, "L");
        } else if (full_time_home_goals < full_time_away_goals) {
          this.updateTeamStats(home_team, full_time_home_goals, full_time_away_goals, "L");
          this.updateTeamStats(away_team, full_time_away_goals, full_time_home_goals, "W");
        } else {
          this.updateTeamStats(home_team, full_time_home_goals, full_time_away_goals, "D");
          this.updateTeamStats(away_team, full_time_away_goals, full_time_home_goals, "D");
        }
      } catch (error) {
        console.error("Error processing match:", match, error);
      }
    }
  }
  getStandings(): StandingsEntry[] {
    const standings = Array.from(this.teamStats.values()).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
      return b.goalsFor - a.goalsFor;
    }).map((stats, index) => ({
      ...stats,
      position: index + 1
    }));
    return standings;
  }
  getTeamStats(team: string): TeamStats | undefined {
    return this.teamStats.get(team);
  }
}
export const safeParseDate = (dateString: string): Date => {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.warn(`Invalid date: ${dateString}, using current date as fallback`);
      return new Date();
    }
    return date;
  } catch (error) {
    console.warn(`Error parsing date: ${dateString}`, error);
    return new Date();
  }
};
export const safeToNumber = (value: unknown): number => {
  if (typeof value === "number" && !isNaN(value)) return value;
  if (typeof value === "string") {
    const parsed = Number.parseFloat(value.trim());
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
};
export const generateStableKey = (prefix: string, index: number, content: string): string => {
  const hash = content.split("").reduce((acc, char) => {
    return (acc << 5) - acc + char.charCodeAt(0) & 0xffffffff;
  }, 0);
  return `${prefix}-${index}-${Math.abs(hash)}`;
};