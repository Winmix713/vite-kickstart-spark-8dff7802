import { useMemo, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { Play, RefreshCw, Square, Timer } from "lucide-react";
import AdminLayout from "@/components/admin/AdminLayout";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useJobs } from "@/hooks/admin/useJobs";
import type { JobSummary } from "@/types/jobs";
const formatStatus = (job: JobSummary) => {
  if (job.last_log?.status === "running") {
    return "Running";
  }
  if (job.enabled) {
    return "Scheduled";
  }
  return "Stopped";
};
const statusVariant = (job: JobSummary): "default" | "secondary" | "destructive" => {
  if (job.last_log?.status === "running") {
    return "default";
  }
  if (job.enabled) {
    return "secondary";
  }
  return "destructive";
};
const calculateSuccessRate = (job: JobSummary) => {
  const total = job.stats.total_runs;
  if (!total) {
    return 0;
  }
  return Math.round(job.stats.success_runs / total * 100);
};
const RunningJobsPage = () => {
  const {
    jobs,
    isLoading,
    isFetching,
    refetch,
    startJob,
    stopJob,
    isStarting,
    isStopping
  } = useJobs({
    refetchInterval: 30_000
  });
  const [jobToStop, setJobToStop] = useState<JobSummary | null>(null);
  const [startingJobName, setStartingJobName] = useState<string | null>(null);
  const [stoppingJobId, setStoppingJobId] = useState<string | null>(null);
  const runningCount = useMemo(() => jobs.filter(job => job.last_log?.status === "running").length, [jobs]);
  const handleStart = useCallback(async (job: JobSummary) => {
    setStartingJobName(job.job_name);
    try {
      await startJob(job.job_name);
    } catch (error) {
      console.error("Failed to start job", error);
    } finally {
      setStartingJobName(null);
    }
  }, [startJob]);
  const handleStopConfirm = useCallback(async () => {
    if (!jobToStop) return;
    setStoppingJobId(jobToStop.id);
    try {
      await stopJob(jobToStop.id);
    } catch (error) {
      console.error("Failed to stop job", error);
    } finally {
      setStoppingJobId(null);
      setJobToStop(null);
    }
  }, [jobToStop, stopJob]);
  const cards = useMemo(() => {
    if (isLoading) {
      return Array.from({
        length: 4
      }).map((_, index) => <Skeleton key={`jobs-skeleton-${index}`} className="h-48 w-full" />);
    }
    if (jobs.length === 0) {
      return <Card className="bg-muted/30">
          <CardHeader>
            <CardTitle>No running jobs</CardTitle>
            <CardDescription>Scheduled jobs will appear here once configured.</CardDescription>
          </CardHeader>
        </Card>;
    }
    return jobs.map(job => {
      const successRate = calculateSuccessRate(job);
      const status = formatStatus(job);
      const progressValue = successRate;
      const isJobStarting = isStarting && startingJobName === job.job_name;
      const isJobStopping = isStopping && stoppingJobId === job.id;
      return <Card key={job.id} className="border-border/60 bg-card/60 backdrop-blur">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <CardTitle className="text-lg font-semibold">{job.job_name}</CardTitle>
                <CardDescription>{job.job_type}</CardDescription>
              </div>
              <Badge variant={statusVariant(job)}>{status}</Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Timer className="h-3.5 w-3.5" />
              <span>Next run: {job.next_run_at ? new Date(job.next_run_at).toLocaleString() : "Manual"}</span>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Success rate</p>
              <div className="mt-2 flex items-center gap-3">
                <Progress value={progressValue} className="h-2 flex-1" />
                <span className="text-sm font-medium text-foreground">{progressValue}%</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground">Total runs</p>
                <p>{job.stats.total_runs}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Average duration</p>
                <p>{job.average_duration_ms ? `${Math.round(job.average_duration_ms / 1000)}s` : "–"}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Enabled</p>
                <p>{job.enabled ? "Yes" : "No"}</p>
              </div>
              <div>
                <p className="font-medium text-foreground">Last status</p>
                <p>{job.last_log?.status ?? "–"}</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex gap-2">
              <Button variant="outline" size="default" className="h-11 gap-2" onClick={() => handleStart(job)} disabled={isJobStarting || isFetching}>
                <Play className="h-4 w-4" />
                {isJobStarting ? "Starting…" : "Start"}
              </Button>
              <Button variant="destructive" size="default" className="h-11 gap-2" onClick={() => setJobToStop(job)} disabled={isJobStopping || !job.enabled}>
                <Square className="h-4 w-4" />
                {isJobStopping ? "Stopping…" : "Stop"}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="ghost" size="default" className="h-11 gap-2">
                <Link to={`/jobs?jobId=${job.id}`}>
                  <RefreshCw className="h-4 w-4" />
                  Logs
                </Link>
              </Button>
            </div>
          </CardFooter>
        </Card>;
    });
  }, [isLoading, jobs, isStarting, startingJobName, isStopping, stoppingJobId, isFetching, handleStart]);
  return <AdminLayout title="Running Jobs" description="Monitor and control live automation pipelines." breadcrumbs={[{
    label: "Admin",
    href: "/admin"
  }, {
    label: "Jobs"
  }]} actions={<Button variant="outline" size="lg" className="gap-2" onClick={() => void refetch()} disabled={isFetching}>
          <RefreshCw className={isFetching ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          Refresh
        </Button>}>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">{runningCount} job{runningCount === 1 ? " is" : "s are"} currently running.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {cards}
        </div>
      </section>

      <ConfirmDialog open={Boolean(jobToStop)} onOpenChange={open => {
      if (!open) {
        setJobToStop(null);
      }
    }} title="Stop job" description={jobToStop ? <span>
              Are you sure you want to stop <span className="font-semibold">{jobToStop.job_name}</span>? This may interrupt active processing.
            </span> : ""} confirmLabel="Stop job" destructive isConfirmLoading={isStopping && stoppingJobId === jobToStop?.id} onConfirm={() => {
      void handleStopConfirm();
    }} />
    </AdminLayout>;
};
export default RunningJobsPage;