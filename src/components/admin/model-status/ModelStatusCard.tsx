import { differenceInDays, format, formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ModelRegistryEntry } from "@/lib/model-registry";
interface ModelStatusCardProps {
  model: ModelRegistryEntry | null | undefined;
  isLoading?: boolean;
  isRetraining?: boolean;
  onTriggerTraining?: () => void;
}
const metricLabels: Array<{
  key: "accuracy" | "precision" | "recall";
  label: string;
}> = [{
  key: "accuracy",
  label: "Pontosság"
}, {
  key: "precision",
  label: "Precízió"
}, {
  key: "recall",
  label: "Recall"
}];
function formatPercentage(value?: number | null) {
  if (typeof value !== "number") {
    return "–";
  }
  return `${(value * 100).toFixed(1)}%`;
}
function getFreshnessBadge(registeredAt?: string) {
  if (!registeredAt) {
    return {
      label: "Ismeretlen frissesség",
      className: "bg-secondary text-secondary-foreground"
    };
  }
  const ageInDays = differenceInDays(new Date(), new Date(registeredAt));
  if (ageInDays < 7) {
    return {
      label: "Friss (<7 nap)",
      className: "bg-emerald-500/15 text-emerald-600 border border-emerald-100"
    };
  }
  if (ageInDays < 21) {
    return {
      label: "Figyelendő (7-21 nap)",
      className: "bg-amber-500/15 text-amber-600 border border-amber-100"
    };
  }
  return {
    label: "Elavult (>21 nap)",
    className: "bg-destructive/10 text-destructive border border-destructive/30"
  };
}
export function ModelStatusCard({
  model,
  isLoading,
  isRetraining,
  onTriggerTraining
}: ModelStatusCardProps) {
  if (isLoading) {
    return <Card>
        <CardHeader>
          <CardTitle>Aktív modell állapota</CardTitle>
          <CardDescription>Betöltés alatt...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Model registry betöltése...</span>
          </div>
        </CardContent>
      </Card>;
  }
  if (!model) {
    return <Card>
        <CardHeader>
          <CardTitle>Aktív modell állapota</CardTitle>
          <CardDescription>Nincs elérhető modell a registry-ben</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            A model_registry.json nem tartalmaz aktív modellt. Ellenőrizd a pipeline futásait
            vagy szinkronizáld a registry fájlt.
          </p>
        </CardContent>
      </Card>;
  }
  const freshness = getFreshnessBadge(model.registered_at);
  const registeredDate = model.registered_at ? new Date(model.registered_at) : undefined;
  return <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-3 text-lg md:text-2xl">
            {model.name}
            <Badge className={cn("text-xs", freshness.className)}>{freshness.label}</Badge>
          </CardTitle>
          <CardDescription>
            {model.algorithm} • Verzió {model.version} • ID {model.id}
          </CardDescription>
        </div>
        <Button type="button" size="lg" onClick={onTriggerTraining} disabled={isRetraining || !onTriggerTraining} className="w-full md:w-auto">
          {isRetraining ? <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Újratréningezés folyamatban...
            </> : <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Újratréningezés
            </>}
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Utolsó tréning
            </p>
            <p className="text-base font-semibold">
              {registeredDate ? formatDistanceToNow(registeredDate, {
              addSuffix: true
            }) : "Ismeretlen"}
            </p>
            {registeredDate && <p className="text-xs text-muted-foreground">
                {format(registeredDate, "yyyy. MMM dd. HH:mm")}
              </p>}
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium text-muted-foreground">Forgalmi arány</p>
            <p className="text-base font-semibold">
              {typeof model.traffic_allocation === "number" ? `${model.traffic_allocation}%` : "0%"}
            </p>
            <p className="text-xs text-muted-foreground">Aktív predikciók aránya</p>
          </div>
          <div className="rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium text-muted-foreground">Státusz</p>
            <p className="text-base font-semibold capitalize">{model.status}</p>
            <p className="text-xs text-muted-foreground">Registry szerinti állapot</p>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">Teljesítmény metrikák</p>
          <div className="flex flex-wrap gap-3">
            {metricLabels.map(metric => <Badge key={metric.key} variant="outline" className="rounded-full bg-muted px-4 py-1 text-sm font-medium">
                {metric.label}: {formatPercentage(model.metrics[metric.key])}
              </Badge>)}
          </div>
        </div>
      </CardContent>
    </Card>;
}