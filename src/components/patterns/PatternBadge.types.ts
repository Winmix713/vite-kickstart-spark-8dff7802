export type PatternTypeKey = "winning_streak" | "home_dominance" | "high_scoring_trend" | "defensive_solid" | "form_surge";
export interface PatternBadgeProps {
  type: PatternTypeKey;
  name?: string;
  confidence: number; // 0-100
  strength: number; // 0-100
  metadata?: Record<string, unknown>;
}