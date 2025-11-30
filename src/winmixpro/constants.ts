import type { ComponentType } from "react";
import { Activity, BarChart3, Cpu, LineChart, MessageSquare, Palette, PlugZap, Shapes, Sparkles, Users, Workflow } from "lucide-react";
export interface WinmixProNavItem {
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{
    className?: string;
  }>;
  badge?: string;
}
export interface WinmixProNavSection {
  title: string;
  items: WinmixProNavItem[];
}
export const WINMIX_PRO_NAV_SECTIONS: WinmixProNavSection[] = [{
  title: "Operáció",
  items: [{
    label: "Felhasználók",
    description: "Jogosultságok, meghívók, szegmensek",
    href: "/winmixpro/users",
    icon: Users,
    badge: "HU"
  }, {
    label: "Folyamatok",
    description: "Scheduler, futó jobok, SLA",
    href: "/winmixpro/jobs",
    icon: Workflow
  }, {
    label: "Modellek",
    description: "Champion/challenger összevetés",
    href: "/winmixpro/models",
    icon: Cpu
  }]
}, {
  title: "Minőség & Visszajelzés",
  items: [{
    label: "Rendszer egészség",
    description: "Heatmap, riasztások, szolgáltatások",
    href: "/winmixpro/health",
    icon: Activity
  }, {
    label: "Integrációk",
    description: "GitHub, Slack, Linear, Sentry",
    href: "/winmixpro/integrations",
    icon: PlugZap
  }, {
    label: "Adatstatisztikák",
    description: "Gól eloszlások, scoreline, minőség",
    href: "/winmixpro/stats",
    icon: BarChart3
  }, {
    label: "Visszajelzések",
    description: "Inbox, priorizálás, naplózás",
    href: "/winmixpro/feedback",
    icon: MessageSquare
  }, {
    label: "Predikciók",
    description: "Pontosság, piac vs modell",
    href: "/winmixpro/predictions",
    icon: LineChart
  }]
}, {
  title: "Haladó felületek",
  items: [{
    label: "Phase 9",
    description: "Kollaboratív súlyok, decay, piac",
    href: "/winmixpro/phase9",
    icon: Sparkles
  }, {
    label: "Témák",
    description: "Glass preset könyvtár, kedvencek",
    href: "/winmixpro/themes",
    icon: Palette
  }, {
    label: "UI kontroll mátrix",
    description: "Függőségek, lefedettség, pin-lista",
    href: "/winmixpro/ui-controls",
    icon: Shapes
  }]
}];
export const WINMIX_PRO_STORAGE_KEYS = ["winmixpro-users-filter", "winmixpro-users-active", "winmixpro-job-filter", "winmixpro-job-state", "winmixpro-integrations-verified", "winmixpro-feedback-status", "winmixpro-phase9-settings", "winmixpro-theme-active", "winmixpro-theme-favorites", "winmixpro-ui-pins", "winmixpro-stats-league", "winmixpro-stats-range", "winmixpro-prediction-range"];