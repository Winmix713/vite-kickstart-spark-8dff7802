export interface WinmixJob {
  id: string;
  name: string;
  category: "Import" | "Modellezés" | "Minőség" | "Piac";
  schedule: string;
  status: "fut" | "sikeres" | "várakozik";
  progress: number;
  owner: string;
  duration: string;
  sla: string;
}
export interface WinmixJobTimelineEntry {
  id: string;
  label: string;
  time: string;
  status: "siker" | "figyelmeztetes" | "hiba";
  detail: string;
}
export const winmixJobStats = {
  running: 4,
  automationScore: 93,
  avgDuration: "12p 18mp"
};
export const winmixJobs: WinmixJob[] = [{
  id: "job-premier-sync",
  name: "Premier League adat szinkron",
  category: "Import",
  schedule: "15 percenként",
  status: "fut",
  progress: 78,
  owner: "Adatcsapat",
  duration: "02:41",
  sla: "12:00"
}, {
  id: "job-challenger-eval",
  name: "Challenger értékelés",
  category: "Modellezés",
  schedule: "óránként",
  status: "sikeres",
  progress: 100,
  owner: "ML műveletek",
  duration: "08:14",
  sla: "15:00"
}, {
  id: "job-feedback-digest",
  name: "Visszajelzés feldolgozás",
  category: "Minőség",
  schedule: "napi 4x",
  status: "várakozik",
  progress: 0,
  owner: "Minőség biztosítás",
  duration: "--",
  sla: "20:00"
}, {
  id: "job-market-blend",
  name: "Piaci odds összevetés",
  category: "Piac",
  schedule: "30 percenként",
  status: "fut",
  progress: 42,
  owner: "Phase 9",
  duration: "03:58",
  sla: "09:30"
}, {
  id: "job-cross-league",
  name: "Kereszt-liga korreláció",
  category: "Modellezés",
  schedule: "2 óránként",
  status: "sikeres",
  progress: 100,
  owner: "Elemzői központ",
  duration: "11:02",
  sla: "16:30"
}];
export const winmixJobTimeline: WinmixJobTimelineEntry[] = [{
  id: "tl-1",
  label: "Premier import lezárva",
  time: "08:05",
  status: "siker",
  detail: "1 248 rekord frissült a legújabb fordulóból."
}, {
  id: "tl-2",
  label: "Model újrakalibrálás",
  time: "08:20",
  status: "figyelmeztetes",
  detail: "Challenger eltérés 2.8%-kal nőtt, manuális ellenőrzés szükséges."
}, {
  id: "tl-3",
  label: "Market API limit",
  time: "08:32",
  status: "hiba",
  detail: "BetRadar endpoint 429-et adott, visszakapcsolás 3 perc múlva."
}, {
  id: "tl-4",
  label: "Heatmap újraszámolva",
  time: "08:40",
  status: "siker",
  detail: "Phase 9 dashboard friss metrikákkal szolgál."
}];