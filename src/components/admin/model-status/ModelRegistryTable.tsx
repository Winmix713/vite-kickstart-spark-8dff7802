import { formatDistanceToNow } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelRegistryEntry } from "@/lib/model-registry";
interface ModelRegistryTableProps {
  models: ModelRegistryEntry[];
  onPromoteModel?: (modelId: string) => void;
  isPromoting?: boolean;
  promotingModelId?: string | null;
}
const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/15 text-emerald-600 border border-emerald-100",
  candidate: "bg-blue-500/15 text-blue-600 border border-blue-100",
  shadow: "bg-purple-500/15 text-purple-600 border border-purple-100",
  retired: "bg-muted text-muted-foreground",
  archived: "bg-muted text-muted-foreground"
};
function formatPercent(value?: number | null) {
  if (typeof value !== "number") {
    return "0%";
  }
  return `${value.toFixed(0)}%`;
}
function formatMetric(metric: number) {
  return `${(metric * 100).toFixed(1)}%`;
}
export function ModelRegistryTable({
  models,
  onPromoteModel,
  isPromoting,
  promotingModelId
}: ModelRegistryTableProps) {
  if (!models.length) {
    return <div className="rounded-lg border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        A registry jelenleg nem tartalmaz modellt. Töltsd fel vagy szinkronizáld a model_registry.json fájlt.
      </div>;
  }
  return <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Modell</TableHead>
            <TableHead>Verzió</TableHead>
            <TableHead>Metrikák (Acc / Prec / Rec)</TableHead>
            <TableHead>Forgalom</TableHead>
            <TableHead>Státusz</TableHead>
            <TableHead>Utolsó frissítés</TableHead>
            <TableHead className="text-right">Művelet</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {models.map(model => {
          const statusClass = statusStyles[model.status] || "bg-secondary text-secondary-foreground";
          const isActive = model.status === "active";
          const lastUpdated = model.registered_at ? formatDistanceToNow(new Date(model.registered_at), {
            addSuffix: true
          }) : "Ismeretlen";
          return <TableRow key={model.id} className={cn(isActive && "bg-emerald-50/60 dark:bg-emerald-950/20")}>
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span>{model.name}</span>
                    <span className="text-xs text-muted-foreground">{model.algorithm}</span>
                  </div>
                </TableCell>
                <TableCell>{model.version}</TableCell>
                <TableCell>
                  <div className="text-sm font-medium">
                    {formatMetric(model.metrics.accuracy)} / {formatMetric(model.metrics.precision)} / {formatMetric(model.metrics.recall)}
                  </div>
                </TableCell>
                <TableCell>{formatPercent(model.traffic_allocation)}</TableCell>
                <TableCell>
                  <Badge className={cn("capitalize", statusClass)}>{model.status}</Badge>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{lastUpdated}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline" onClick={() => onPromoteModel?.(model.id)} disabled={isActive || isPromoting || !onPromoteModel}>
                    {promotingModelId === model.id ? <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Aktiválás...
                      </> : "Promote to Active"}
                  </Button>
                </TableCell>
              </TableRow>;
        })}
        </TableBody>
      </Table>
    </div>;
}