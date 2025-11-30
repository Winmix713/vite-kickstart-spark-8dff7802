import { format, formatDistanceToNow } from "date-fns";
import { Play, Loader2, FileText, Edit, Trash2, MoreHorizontal, Copy } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CopyButton, CopyBadge } from "@/components/common";
import { cn } from "@/lib/utils";
import type { JobSummary } from "@/types/jobs";
const JOB_LABELS: Record<string, string> = {
  fetch_upcoming_fixtures: "Közelgő mérkőzések frissítése",
  run_daily_predictions: "Napi predikció futtatás",
  update_team_stats: "Csapat statisztika frissítés",
  cleanup_old_logs: "Régi logok karbantartása"
};
interface JobStatusCardProps {
  job: JobSummary;
  onToggle: (enabled: boolean) => void;
  onRun: () => void;
  onViewLogs: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isToggling: boolean;
  isRunning: boolean;
}
function resolveStatus(job: JobSummary): {
  label: string;
  variant: "success" | "warning" | "error" | "info" | "disabled";
} {
  if (!job.enabled) return {
    label: "Kikapcsolva",
    variant: "disabled"
  };
  const lastStatus = job.last_log?.status;
  if (lastStatus === "running") return {
    label: "Fut",
    variant: "warning"
  };
  if (lastStatus === "error") return {
    label: "Hiba",
    variant: "error"
  };
  if (job.is_due) return {
    label: "Futás esedékes",
    variant: "warning"
  };
  if (lastStatus === "success") return {
    label: "Sikeres",
    variant: "success"
  };
  return {
    label: "Várakozik",
    variant: "info"
  };
}
function getStatusBadgeClass(variant: "success" | "warning" | "error" | "info" | "disabled") {
  switch (variant) {
    case "success":
      return "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30";
    case "warning":
      return "bg-amber-500/15 text-amber-500 border border-amber-500/30";
    case "error":
      return "bg-rose-500/15 text-rose-500 border border-rose-500/30";
    case "disabled":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-primary/10 text-primary border border-primary/30";
  }
}
function formatDateTime(value: string | null, fallback = "N/A") {
  if (!value) return fallback;
  try {
    return format(new Date(value), "yyyy.MM.dd. HH:mm");
  } catch (error) {
    console.error("Failed to format date", value, error);
    return fallback;
  }
}
function formatRelative(value: string | null) {
  if (!value) return "Még nem futott";
  try {
    return formatDistanceToNow(new Date(value), {
      addSuffix: true
    });
  } catch (error) {
    console.error("Failed to format distance", value, error);
    return "Ismeretlen";
  }
}
function formatDuration(durationMs: number | null): string {
  if (!durationMs || durationMs <= 0) return "-";
  if (durationMs < 1000) return `${durationMs} ms`;
  const seconds = durationMs / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} mp`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes} p ${remainingSeconds} mp`;
}
function formatSuccessRate(stats: JobSummary["stats"]): string {
  if (!stats || stats.total_runs === 0) return "-";
  const rate = stats.success_runs / stats.total_runs * 100;
  return `${Math.round(rate)}%`;
}
function formatJobType(jobType: string): string {
  return jobType.split("_").map(part => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
function resolveDisplayName(job: JobSummary) {
  return JOB_LABELS[job.job_name] ?? job.job_name.split("_").map(part => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
function resolveDescription(job: JobSummary) {
  const configDescription = job.config?.description;
  if (typeof configDescription === "string" && configDescription.length > 0) {
    return configDescription;
  }
  return "Automatizált háttérfeladat";
}
export default function JobStatusCard({
  job,
  onToggle,
  onRun,
  onViewLogs,
  onEdit,
  onDelete,
  isToggling,
  isRunning
}: JobStatusCardProps) {
  const status = resolveStatus(job);
  const badgeClass = getStatusBadgeClass(status.variant);
  const successRate = formatSuccessRate(job.stats);
  return <Card data-testid="job-card" className="bg-card/60 border-border/80 backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-foreground">
              {resolveDisplayName(job)}
            </CardTitle>
            <p className="text-sm text-muted-foreground max-w-xl">
              {resolveDescription(job)}
            </p>
          </div>
          <Badge className={cn("uppercase text-[11px] font-semibold tracking-wide", badgeClass)}>
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium uppercase tracking-wide">
            {formatJobType(job.job_type)}
          </span>
          <div className="flex items-center gap-2 text-xs">
            <span>Utolsó futás:</span>
            <span className="text-foreground font-medium">{formatRelative(job.last_run_at)}</span>
          </div>
          <CopyBadge text={job.id} showIcon={true} className="font-mono text-xs" aria-label={`Copy job ID: ${job.id}`}>
            ID: {job.id.slice(0, 8)}...
          </CopyBadge>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <CopyBadge text={job.cron_expression} showIcon={true} className="font-mono text-xs" aria-label={`Copy cron expression: ${job.cron_expression}`}>
            Cron: {job.cron_expression}
          </CopyBadge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Következő tervezett futás</p>
            <p className="font-medium text-foreground">{formatDateTime(job.next_run_at, job.enabled ? "Ütemezés alatt" : "Kikapcsolva")}</p>
            {job.is_due && job.enabled && <p className="text-xs text-amber-500">Az ütemezett időpont elérkezett – a job futtatásra vár.</p>}
          </div>
          <div className="rounded-lg border border-border/60 bg-muted/20 p-4 space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Teljesítmény</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Sikerarány</p>
                <p className="font-medium text-foreground">{successRate}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Átlagos futási idő</p>
                <p className="font-medium text-foreground">{formatDuration(job.average_duration_ms)}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-xs">Futások száma</p>
                <p className="font-medium text-foreground">{job.stats.total_runs}</p>
              </div>
            </div>
            {job.last_log && job.last_log.status !== "running" && <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Utolsó futás: {job.last_log.records_processed ?? 0} rekord feldolgozva {job.last_log.duration_ms ? `(${formatDuration(job.last_log.duration_ms)})` : ""}
                </p>
                {job.last_log.message && <CopyButton text={job.last_log.message} size="sm" variant="ghost" successMessage="Log message copied to clipboard">
                    <Copy className="w-3 h-3 mr-1" />
                    Copy Log
                  </CopyButton>}
              </div>}
          </div>
        </div>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Switch data-testid="job-toggle" checked={job.enabled} disabled={isToggling || isRunning} onCheckedChange={value => onToggle(value)} />
            <div>
              <p className="text-sm font-medium text-foreground">Automatikus futtatás</p>
              <p className="text-xs text-muted-foreground">
                {job.enabled ? "A job az ütemezés szerint fut." : "A job jelenleg kézi futtatásra vár."}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button size="sm" onClick={onRun} disabled={isRunning || isToggling} className="inline-flex items-center gap-2">
            {isRunning ? <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </> : <>
                <Play className="w-4 h-4" />
                Run Now
              </>}
          </Button>
          <Button size="sm" variant="outline" onClick={onViewLogs} className="inline-flex items-center gap-2">
            <FileText className="w-4 h-4" />
            View Logs
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {(onEdit || onDelete) && <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEdit && <DropdownMenuItem onClick={onEdit}>
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>}
                {onDelete && <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>}
          <div className="text-xs text-muted-foreground">
            Last updated: {formatDateTime(job.last_log?.started_at ?? null, "No data")}
          </div>
        </div>
      </CardFooter>
    </Card>;
}