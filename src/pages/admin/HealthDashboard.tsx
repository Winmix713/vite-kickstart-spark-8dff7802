import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCcw, Activity } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import RoleGate from "@/components/admin/RoleGate";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SystemHealthCard from "@/components/monitoring/SystemHealthCard";
import PerformanceMetricsChart from "@/components/monitoring/PerformanceMetricsChart";
import type { MetricsPoint } from "@/components/monitoring/PerformanceMetricsChart.types";
import { supabase } from "@/integrations/supabase/client";
import type { HealthSummaryResponse, MetricsResponse, PerformanceMetricRow } from "@/types/monitoring";
const useHealth = () => useQuery<HealthSummaryResponse>({
  queryKey: ["monitoring", "health-dashboard"],
  queryFn: async () => {
    const {
      data,
      error
    } = await supabase.functions.invoke<HealthSummaryResponse>("monitoring-health");
    if (error) throw new Error(error.message);
    return data as HealthSummaryResponse;
  },
  refetchInterval: 30000
});
const useMetrics = (component?: string | null) => useQuery<MetricsResponse>({
  queryKey: ["monitoring", "metrics", component ?? "all"],
  queryFn: async () => {
    const {
      data,
      error
    } = await supabase.functions.invoke<MetricsResponse>("monitoring-metrics", {
      body: component ? {
        component
      } : {}
    });
    if (error) throw new Error(error.message);
    return data as MetricsResponse;
  },
  enabled: true,
  refetchInterval: 30000
});
export default function HealthDashboard() {
  return <RoleGate allowedRoles={["admin", "analyst"]}>
      <InnerDashboard />
    </RoleGate>;
}
function InnerDashboard() {
  const healthQuery = useHealth();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const metricsQuery = useMetrics(selectedComponent);
  const metricsData: MetricsPoint[] = useMemo(() => {
    const rows: PerformanceMetricRow[] = metricsQuery.data?.metrics ?? [];
    const byTime = new Map<string, MetricsPoint>();
    for (const r of rows) {
      const key = r.timestamp;
      if (!byTime.has(key)) byTime.set(key, {
        time: key
      });
      const point = byTime.get(key)!;
      if (r.metric_name === "latency_p50") point.p50 = r.value;
      if (r.metric_name === "latency_p95") point.p95 = r.value;
      if (r.metric_name === "latency_p99") point.p99 = r.value;
    }
    return Array.from(byTime.values()).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [metricsQuery.data]);
  return <AdminLayout title="Health Dashboard" description="Real-time system health and performance overview" breadcrumbs={[{
    label: "Admin",
    href: "/admin"
  }, {
    label: "Health"
  }]} actions={<Button variant="outline" size="sm" onClick={() => {
    void healthQuery.refetch();
    void metricsQuery.refetch();
  }} className="inline-flex items-center gap-2">
          <RefreshCcw className="w-4 h-4" />
          Refresh
        </Button>}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {(healthQuery.data?.components ?? []).map(h => <SystemHealthCard key={h.id} health={h} />)}
      </div>

      <Card className="border-border/60 bg-muted/20">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Metrics
          </CardTitle>
          <div className="flex items-center gap-2 w-full sm:w-64">
            <Select value={selectedComponent ?? undefined} onValueChange={v => setSelectedComponent(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select component" />
              </SelectTrigger>
              <SelectContent>
                {(healthQuery.data?.components ?? []).map(h => <SelectItem key={h.id} value={h.component_name}>{h.component_name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={() => void metricsQuery.refetch()}>
              <RefreshCcw className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <PerformanceMetricsChart data={metricsData} />
        </CardContent>
      </Card>
    </AdminLayout>;
}