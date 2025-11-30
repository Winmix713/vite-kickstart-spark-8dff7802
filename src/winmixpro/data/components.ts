export interface WinmixUiControl {
  id: string;
  name: string;
  surface: string;
  status: "stabil" | "figyelni";
  dependsOn: string[];
  owner: string;
}
export const winmixUiControls: WinmixUiControl[] = [{
  id: "ui-prediction-card",
  name: "Predikció kártya",
  surface: "Dashboard",
  status: "stabil",
  dependsOn: ["Pontosság grafikon", "Odds modul", "Piaci divergencia"],
  owner: "Frontend"
}, {
  id: "ui-market-panel",
  name: "Market overlay",
  surface: "Phase 9",
  status: "figyelni",
  dependsOn: ["Odds modul", "Élő API", "Jogosultság chip"],
  owner: "Phase 9"
}, {
  id: "ui-job-timeline",
  name: "Job idővonal",
  surface: "Automatizáció",
  status: "stabil",
  dependsOn: ["Audit log", "SLA badge"],
  owner: "Ops UI"
}, {
  id: "ui-theme-tuner",
  name: "Téma menedzser",
  surface: "Design System",
  status: "figyelni",
  dependsOn: ["Glass preset", "Color token"],
  owner: "DesignOps"
}];