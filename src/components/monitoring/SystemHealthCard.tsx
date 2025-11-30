import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SystemHealthSnapshot } from "@/types/monitoring";
interface Props {
  health: SystemHealthSnapshot;
}
const statusColor = (status: string) => status === "healthy" ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" : status === "degraded" ? "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" : status === "down" ? "bg-red-500/20 text-red-300 border-red-500/30" : "bg-muted text-muted-foreground";
export function SystemHealthCard({
  health
}: Props) {
  const {
    component_name,
    component_type,
    status,
    response_time_ms,
    error_rate,
    cpu_usage,
    memory_usage
  } = health;
  const cpu = typeof cpu_usage === "number" ? Math.round(cpu_usage) : null;
  const mem = typeof memory_usage === "number" ? Math.round(memory_usage) : null;
  return <Card className="border-border/60 bg-muted/20">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold">{component_name}</CardTitle>
        <Badge className={cn("border", statusColor(status))}>{status.toUpperCase()}</Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-muted-foreground">Type</div>
            <div className="font-medium">{component_type}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Response time</div>
            <div className="font-medium">{response_time_ms ?? "-"} ms</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Error rate</div>
            <div className="font-medium">{typeof error_rate === "number" ? (error_rate * 100).toFixed(1) + "%" : "-"}</div>
          </div>
          <div className="space-y-1">
            <div className="text-muted-foreground">Checked at</div>
            <div className="font-medium">{new Date(health.checked_at).toLocaleTimeString()}</div>
          </div>
        </div>

        {(cpu !== null || mem !== null) && <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {cpu !== null && <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">CPU</span>
                  <span className="font-medium">{cpu}%</span>
                </div>
                <Progress value={cpu} className="h-2" />
              </div>}
            {mem !== null && <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Memory</span>
                  <span className="font-medium">{mem}%</span>
                </div>
                <Progress value={mem} className="h-2" />
              </div>}
          </div>}
      </CardContent>
    </Card>;
}
export default SystemHealthCard;