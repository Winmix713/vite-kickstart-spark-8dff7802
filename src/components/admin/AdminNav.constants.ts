import type { AdminNavItem } from "@/types/admin";
import { LayoutDashboard, Users, Workflow, Database, Cpu, ShieldCheck, Activity, MessageSquare } from "lucide-react";
export const NAV_SECTIONS: Array<{
  label: string;
  items: AdminNavItem[];
}> = [{
  label: "Overview",
  items: [{
    label: "Dashboard",
    description: "Summary of system status",
    href: "/admin",
    icon: LayoutDashboard,
    roles: ["admin", "analyst"]
  }]
}, {
  label: "Management",
  items: [{
    label: "Users & Roles",
    description: "Manage team members",
    href: "/admin/users",
    icon: Users,
    roles: ["admin"]
  }, {
    label: "Running Jobs",
    description: "Control automations",
    href: "/admin/jobs",
    icon: Workflow,
    roles: ["admin", "analyst"]
  }, {
    label: "Phase 9 Settings",
    description: "Adjust collaborative AI",
    href: "/admin/phase9",
    icon: Cpu,
    roles: ["admin", "analyst"]
  }, {
    label: "Feedback Inbox",
    description: "Review user feedback and suggestions",
    href: "/admin/feedback",
    icon: Activity,
    roles: ["admin", "analyst"]
  }]
}, {
  label: "System",
  items: [{
    label: "Health Dashboard",
    description: "System status & performance",
    href: "/admin/health",
    icon: Activity,
    roles: ["admin", "analyst"]
  }, {
    label: "Stats & Data Quality",
    description: "Distributions, scorelines, data checks",
    href: "/admin/stats",
    icon: Database,
    roles: ["admin", "analyst"]
  }, {
    label: "Integrations",
    description: "GitHub, Linear, Slack, Sentry, etc.",
    href: "/admin/integrations",
    icon: Workflow,
    roles: ["admin", "analyst"]
  }, {
    label: "Database & Content",
    description: "Coming soon",
    href: "/admin/database",
    icon: Database,
    roles: ["admin"]
  }, {
    label: "Security",
    description: "Coming soon",
    href: "/admin/security",
    icon: ShieldCheck,
    roles: ["admin"]
  }]
}, {
  label: "WinmixPro",
  items: [{
    label: "Dashboard",
    description: "System overview and metrics",
    href: "/winmixpro/admin",
    icon: LayoutDashboard,
    roles: ["admin", "analyst"]
  }, {
    label: "Features",
    description: "Manage feature toggles",
    href: "/winmixpro/admin/features",
    icon: Settings,
    roles: ["admin", "analyst"]
  }, {
    label: "Design",
    description: "Theme and UI customization",
    href: "/winmixpro/admin/design",
    icon: Palette,
    roles: ["admin", "analyst"]
  }, {
    label: "Components",
    description: "Component management and metrics",
    href: "/winmixpro/admin/components",
    icon: Package,
    roles: ["admin", "analyst"]
  }]
}];