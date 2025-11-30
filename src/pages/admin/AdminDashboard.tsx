import { useMemo, useCallback } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { Activity, Cpu, Database, Gauge, LayoutDashboard, ShieldCheck, Users, Workflow } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import CategoryCard from "@/components/admin/CategoryCard";
import { useJobs } from "@/hooks/admin/useJobs";
import { usePhase9Settings } from "@/hooks/admin/usePhase9Settings";
import { useAuth } from "@/hooks/useAuth";
import { getSystemMetrics } from "@/lib/admin-utils";
import type { AdminCategoryCard } from "@/types/admin";
const AdminDashboard = () => {
  const {
    data: metrics,
    isLoading: metricsLoading
  } = useQuery({
    queryKey: ["admin", "system-metrics"],
    queryFn: getSystemMetrics,
    staleTime: 60_000,
    refetchInterval: 120_000
  });
  const {
    jobs,
    isLoading: jobsLoading
  } = useJobs({
    refetchInterval: 60_000
  });
  const {
    settings
  } = usePhase9Settings();
  const {
    profile
  } = useAuth();
  const role = profile?.role ?? "user";
  const runningJobs = useMemo(() => {
    if (jobsLoading || !jobs) {
      return null;
    }
    return jobs.filter(job => job.last_log?.status === "running").length;
  }, [jobs, jobsLoading]);
  const cards: AdminCategoryCard[] = useMemo(() => {
    const baseCards: AdminCategoryCard[] = [{
      id: "dashboard-overview",
      title: "System Overview",
      description: "Health indicators across the platform",
      href: "/admin",
      icon: LayoutDashboard,
      accentColorClass: "from-sky-500/10 to-sky-500/5",
      value: "Live",
      pill: "Realtime"
    }, {
      id: "users",
      title: "Users & Roles",
      description: "Invite, promote and revoke access",
      href: "/admin/users",
      icon: Users,
      accentColorClass: "from-emerald-500/10 to-emerald-500/5",
      value: metrics?.totalUsers ?? null,
      allowedRoles: ["admin"]
    }, {
      id: "jobs",
      title: "Running Jobs",
      description: "Manage automation lifecycle",
      href: "/admin/jobs",
      icon: Workflow,
      accentColorClass: "from-amber-500/10 to-amber-500/5",
      value: runningJobs
    }, {
      id: "models",
      title: "AI & Predictions",
      description: "Model activity and performance",
      href: "/models",
      icon: Activity,
      accentColorClass: "from-purple-500/10 to-purple-500/5",
      value: metrics?.totalModels ?? null
    }, {
      id: "model-status",
      title: "Model Control Center",
      description: "ML model management & analytics",
      href: "/admin/model-status",
      icon: Gauge,
      accentColorClass: "from-blue-500/10 to-blue-500/5",
      value: "Dashboard",
      pill: "Live",
      allowedRoles: ["admin", "analyst"]
    }, {
      id: "phase9",
      title: "Phase 9",
      description: "Collaborative intelligence controls",
      href: "/admin/phase9",
      icon: Cpu,
      accentColorClass: "from-fuchsia-500/10 to-fuchsia-500/5",
      value: settings ? settings.collaborative_intelligence_enabled ? "Enabled" : "Disabled" : null,
      pill: settings?.market_integration_mode ? settings.market_integration_mode.toUpperCase() : undefined
    }, {
      id: "database",
      title: "Database & Content",
      description: "Curate data sources and feeds",
      href: "/admin/database",
      icon: Database,
      accentColorClass: "from-indigo-500/10 to-indigo-500/5",
      value: metrics?.totalMatches ?? null,
      allowedRoles: ["admin"]
    }, {
      id: "system",
      title: "System",
      description: "Security, compliance, and auditing",
      href: "/admin/security",
      icon: ShieldCheck,
      accentColorClass: "from-slate-500/10 to-slate-500/5",
      value: "Coming soon"
    }];
    return baseCards.filter(card => !card.allowedRoles || card.allowedRoles.includes(role));
  }, [metrics, runningJobs, settings, role]);
  return <AdminLayout title="Admin Dashboard" description="High-level overview of accounts, automations, and experimental systems." breadcrumbs={[{
    label: "Admin",
    href: "/admin"
  }, {
    label: "Dashboard"
  }]}>
      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cards.map(card => <CategoryCard key={card.id} card={card} />)}
      </section>
    </AdminLayout>;
};
export default AdminDashboard;