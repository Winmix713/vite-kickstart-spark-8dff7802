import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { JobLog, JobSummary } from "@/types/jobs";
interface JobLogsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobSummary | null;
  logs: JobLog[];
  isLoading: boolean;
  onRefresh: () => void;
}
function statusBadgeClass(status: JobLog["status"]) {
  switch (status) {
    case "success":
      return "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30";
    case "error":
      return "bg-rose-500/15 text-rose-500 border border-rose-500/30";
    case "running":
    default:
      return "bg-amber-500/15 text-amber-500 border border-amber-500/30";
  }
}
function statusLabel(status: JobLog["status"]) {
  switch (status) {
    case "success":
      return "Sikeres";
    case "error":
      return "Hiba";
    case "running":
    default:
      return "Folyamatban";
  }
}
function formatDate(value: string | null) {
  if (!value) return "-";
  try {
    return format(new Date(value), "yyyy.MM.dd. HH:mm:ss");
  } catch (error) {
    console.error("Failed to format date", value, error);
    return value;
  }
}
function formatDuration(duration: number | null) {
  if (!duration || duration <= 0) return "-";
  if (duration < 1000) return `${duration} ms`;
  const seconds = duration / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)} mp`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${minutes} p ${remainingSeconds} mp`;
}
function resolveDisplayName(job: JobSummary | null) {
  if (!job) return "";
  const mapping: Record<string, string> = {
    fetch_upcoming_fixtures: "Közelgő mérkőzések frissítése",
    run_daily_predictions: "Napi predikció futtatás",
    update_team_stats: "Csapat statisztika frissítés",
    cleanup_old_logs: "Régi logok karbantartása"
  };
  if (mapping[job.job_name]) return mapping[job.job_name];
  return job.job_name.split("_").map(part => part[0]?.toUpperCase() + part.slice(1)).join(" ");
}
export function JobLogsDialog({
  open,
  onOpenChange,
  job,
  logs,
  isLoading,
  onRefresh
}: JobLogsDialogProps) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Futtatási napló – {resolveDisplayName(job)}</DialogTitle>
          <DialogDescription>
            Részletes információk a legutóbbi futtatásokról és hibákról.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="text-sm text-muted-foreground">
            Összes futás: <span className="font-medium text-foreground">{job?.stats.total_runs ?? 0}</span> ·
            Sikeres futások: <span className="font-medium text-foreground">{job?.stats.success_runs ?? 0}</span>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh} disabled={isLoading || !job}>
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Frissítés"}
          </Button>
        </div>

        {isLoading ? <div className="py-16 flex items-center justify-center text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Betöltés folyamatban...
          </div> : logs.length === 0 ? <div className="py-16 text-center text-sm text-muted-foreground">
            Ehhez a jobhoz még nem érhető el futtatási napló.
          </div> : <ScrollArea className="max-h-[420px] rounded-md border border-border/60">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Státusz</TableHead>
                  <TableHead>Kezdés időpontja</TableHead>
                  <TableHead>Befejezés</TableHead>
                  <TableHead>Időtartam</TableHead>
                  <TableHead className="text-right">Feldolgozott rekordok</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => <TableRow key={log.id}>
                    <TableCell>
                      <Badge className={cn("uppercase text-[11px]", statusBadgeClass(log.status))}>
                        {statusLabel(log.status)}
                      </Badge>
                      {log.error_message && <p className="text-xs text-rose-400 mt-1 max-w-xs">{log.error_message}</p>}
                    </TableCell>
                    <TableCell>{formatDate(log.started_at)}</TableCell>
                    <TableCell>{formatDate(log.completed_at)}</TableCell>
                    <TableCell>{formatDuration(log.duration_ms)}</TableCell>
                    <TableCell className="text-right">{log.records_processed ?? 0}</TableCell>
                  </TableRow>)}
              </TableBody>
            </Table>
          </ScrollArea>}
      </DialogContent>
    </Dialog>;
}