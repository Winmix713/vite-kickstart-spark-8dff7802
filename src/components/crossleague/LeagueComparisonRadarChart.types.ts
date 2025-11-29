export interface LeagueRadarMetric {
  leagueId: string;
  leagueName: string;
  metrics: {
    goals: number; // 0..100
    home_adv: number; // 0..100
    balance: number; // 0..100
    predictability: number; // 0..100
    physicality: number; // 0..100
  };
}