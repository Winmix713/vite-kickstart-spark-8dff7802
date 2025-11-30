import { z } from "zod";
export const matchSchema = z.object({
  home_team: z.string(),
  away_team: z.string(),
  full_time_home_goals: z.number().int().min(0),
  full_time_away_goals: z.number().int().min(0)
});
export interface Match {
  match_time: string;
  home_team: string;
  away_team: string;
  half_time_home_goals: number;
  half_time_away_goals: number;
  full_time_home_goals: number;
  full_time_away_goals: number;
  round?: string;
  league?: string;
  venue?: string;
  referee?: string;
  attendance?: number;
  weather?: string;
  // Aliases for compatibility
  date?: string;
  home_score?: number;
  away_score?: number;
  ht_home_score?: number;
  ht_away_score?: number;
}
export interface LeagueData {
  id: string;
  name: string;
  season: string;
  winner: string;
  secondPlace: string;
  thirdPlace: string;
  status: "In Progress" | "Completed";
}
export interface StandingsEntry {
  position: number;
  team: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: Array<"W" | "D" | "L">;
  previousPosition?: number;
}
export interface TeamForm {
  position: number;
  team: string;
  played: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  form: Array<"W" | "D" | "L"> | string;
}
export type TeamStats = Omit<StandingsEntry, "position" | "previousPosition">;