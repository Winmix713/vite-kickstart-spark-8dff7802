export interface WinmixPredictionPoint {
  label: string;
  model: number;
  crowd: number;
  market: number;
}
export interface WinmixPredictionRow {
  id: string;
  match: string;
  league: string;
  kickoff: string;
  modelPick: string;
  confidence: number;
  marketDelta: number;
}
export const winmixPredictionAccuracy: WinmixPredictionPoint[] = [{
  label: "H",
  model: 91,
  crowd: 84,
  market: 82
}, {
  label: "K",
  model: 92,
  crowd: 85,
  market: 82.5
}, {
  label: "Sze",
  model: 92.4,
  crowd: 84.2,
  market: 82.1
}, {
  label: "Cs",
  model: 91.8,
  crowd: 83.9,
  market: 81.7
}, {
  label: "P",
  model: 93.1,
  crowd: 85.3,
  market: 82.2
}, {
  label: "Szo",
  model: 93.4,
  crowd: 85.6,
  market: 82.4
}, {
  label: "V",
  model: 93.8,
  crowd: 85.9,
  market: 82.7
}];
export const winmixUpcomingPredictions: WinmixPredictionRow[] = [{
  id: "pred-1",
  match: "Arsenal vs. Newcastle",
  league: "Premier League",
  kickoff: "Ma 20:30",
  modelPick: "Hazai győzelem",
  confidence: 74,
  marketDelta: 6
}, {
  id: "pred-2",
  match: "Inter vs. Bologna",
  league: "Serie A",
  kickoff: "Ma 18:45",
  modelPick: "2.5 gól felett",
  confidence: 68,
  marketDelta: 4
}, {
  id: "pred-3",
  match: "Fradi vs. Kisvárda",
  league: "NB I",
  kickoff: "Holnap 17:00",
  modelPick: "BTTS Igen",
  confidence: 64,
  marketDelta: 3
}];