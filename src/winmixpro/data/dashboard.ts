import type { DashboardMetrics } from "@/winmixpro/types";
export const dashboardMetrics: DashboardMetrics = {
  totalUsers: 1248,
  activeJobs: 3,
  accuracy: 87.3,
  modelsDeployed: 8,
  uptime: 99.7,
  avgResponseTime: 182
};
export const dashboardKPIs = [{
  label: "Összes felhasználó",
  value: 1248,
  trend: "+12 ezen a héten",
  intent: "positive" as const,
  description: "Regisztrált és aktív felhasználók száma"
}, {
  label: "Aktív feladatok",
  value: 3,
  trend: "2 sikeres, 1 futó",
  intent: "neutral" as const,
  description: "Jelenleg futó és ütemezett jobok"
}, {
  label: "Pontosság",
  value: "87.3%",
  trend: "+1.2% az előző héthez képest",
  intent: "positive" as const,
  description: "Model pontossági átlag az elmúlt 7 napban"
}, {
  label: "Telepített modellek",
  value: 8,
  trend: "2 champion, 3 challenger, 3 shadow",
  intent: "neutral" as const,
  description: "Összes aktív ML modell a rendszerben"
}];