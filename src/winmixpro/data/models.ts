export interface WinmixModel {
  id: string;
  name: string;
  type: "champion" | "challenger" | "shadow";
  accuracy: number;
  trend: number;
  league: string;
  freshness: string;
  trafficShare: number;
}
export interface WinmixModelSeriesPoint {
  week: string;
  champion: number;
  challenger: number;
  market: number;
}
export const winmixModels: WinmixModel[] = [{
  id: "mdl-nexus",
  name: "Nexus v3.1",
  type: "champion",
  accuracy: 92.1,
  trend: 1.8,
  league: "Premier League",
  freshness: "22 perc",
  trafficShare: 64
}, {
  id: "mdl-orbit",
  name: "Orbit Pioneer",
  type: "challenger",
  accuracy: 89.4,
  trend: 2.4,
  league: "Serie A",
  freshness: "12 perc",
  trafficShare: 24
}, {
  id: "mdl-vektor",
  name: "Vektor NB",
  type: "shadow",
  accuracy: 84.6,
  trend: -0.4,
  league: "NB I",
  freshness: "41 perc",
  trafficShare: 12
}];
export const winmixModelSeries: WinmixModelSeriesPoint[] = [{
  week: "H",
  champion: 90,
  challenger: 86,
  market: 81
}, {
  week: "K",
  champion: 91,
  challenger: 87,
  market: 82
}, {
  week: "Sze",
  champion: 92,
  challenger: 88,
  market: 83
}, {
  week: "Cs",
  champion: 92.4,
  challenger: 89.1,
  market: 83.4
}, {
  week: "P",
  champion: 91.7,
  challenger: 88.6,
  market: 82.9
}, {
  week: "Szo",
  champion: 92.8,
  challenger: 89.4,
  market: 83.1
}, {
  week: "V",
  champion: 93.2,
  challenger: 89.9,
  market: 83.7
}];