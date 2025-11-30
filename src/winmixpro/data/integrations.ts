export interface WinmixIntegration {
  id: string;
  name: string;
  owner: string;
  status: "configured" | "partial" | "missing";
  keys: string[];
  lastSync: string;
  description: string;
}
export const winmixIntegrations: WinmixIntegration[] = [{
  id: "gh",
  name: "GitHub Actions",
  owner: "DevOps",
  status: "configured",
  keys: ["GITHUB_TOKEN", "GITHUB_REPOSITORY"],
  lastSync: "08:15",
  description: "Model pipeline build + release."
}, {
  id: "linear",
  name: "Linear",
  owner: "PMO",
  status: "partial",
  keys: ["LINEAR_API_KEY"],
  lastSync: "07:58",
  description: "Roadmap synk, backlog import."
}, {
  id: "slack",
  name: "Slack",
  owner: "Ops",
  status: "configured",
  keys: ["SLACK_WEBHOOK_URL"],
  lastSync: "08:34",
  description: "Figyelmeztetések és Phase 9 update."
}, {
  id: "sentry",
  name: "Sentry",
  owner: "Frontend",
  status: "partial",
  keys: ["VITE_SENTRY_DSN"],
  lastSync: "07:41",
  description: "UI hibák, mobil fallback."
}, {
  id: "cf",
  name: "Cloudflare Turnstile",
  owner: "Security",
  status: "missing",
  keys: ["VITE_TURNSTILE_KEY"],
  lastSync: "--",
  description: "Belépési védelmi réteg aktiválása."
}];