import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RefreshCcw, Play, Pause, Edit, Trash2, Plus, Clock, Settings, Activity, AlertTriangle, CheckCircle } from "lucide-react";
import AuthGate from "@/components/AuthGate";
import JobStatusCard from "@/components/jobs/JobStatusCard";
import { JobLogsDialog } from "@/components/jobs/JobLogsDialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { JobSummary, JobLog, JobListResponse, JobLogsResponse, JobToggleResponse, JobTriggerResponse, JobFormData, CronValidation, JobType } from "@/types/admin";
import PageLayout from "@/components/layout/PageLayout";
import PageHeader from "@/components/layout/PageHeader";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
const fetchJobs = async (): Promise<JobSummary[]> => {
  const {
    data,
    error
  } = await supabase.functions.invoke<JobListResponse>("jobs-list");
  if (error) {
    throw new Error(error.message ?? "Failed to load scheduled jobs");
  }
  return data?.jobs ?? [];
};
const createJob = async (data: JobFormData): Promise<JobSummary> => {
  const {
    data: result,
    error
  } = await supabase.functions.invoke<JobSummary>("jobs-create", {
    body: data
  });
  if (error) throw new Error(error.message);
  return result;
};
const updateJob = async (id: string, data: Partial<JobFormData>): Promise<JobSummary> => {
  const {
    data: result,
    error
  } = await supabase.functions.invoke<JobSummary>("jobs-update", {
    body: {
      id,
      ...data
    }
  });
  if (error) throw new Error(error.message);
  return result;
};
const deleteJob = async (id: string): Promise<void> => {
  const {
    error
  } = await supabase.functions.invoke("jobs-delete", {
    body: {
      id
    }
  });
  if (error) throw new Error(error.message);
};
const validateCron = async (cronExpression: string): Promise<CronValidation> => {
  const {
    data,
    error
  } = await supabase.functions.invoke<CronValidation>("jobs-validate-cron", {
    body: {
      cronExpression
    }
  });
  if (error) throw new Error(error.message);
  return data || {
    valid: false
  };
};
const JOB_TYPES: Array<{
  value: JobType;
  label: string;
  description: string;
}> = [{
  value: 'data_import',
  label: 'Data Import',
  description: 'Import data from external sources'
}, {
  value: 'prediction',
  label: 'Prediction',
  description: 'Run AI predictions'
}, {
  value: 'aggregation',
  label: 'Aggregation',
  description: 'Aggregate statistics and metrics'
}, {
  value: 'maintenance',
  label: 'Maintenance',
  description: 'System maintenance tasks'
}, {
  value: 'monitoring',
  label: 'Monitoring',
  description: 'Health checks and monitoring'
}];
const CRON_PRESETS: Array<{
  label: string;
  expression: string;
  description: string;
}> = [{
  label: 'Every minute',
  expression: '* * * * *',
  description: 'Runs every minute'
}, {
  label: 'Every hour',
  expression: '0 * * * *',
  description: 'Runs at the start of every hour'
}, {
  label: 'Every 6 hours',
  expression: '0 */6 * * *',
  description: 'Runs at 00:00, 06:00, 12:00, 18:00'
}, {
  label: 'Daily at midnight',
  expression: '0 0 * * *',
  description: 'Runs every day at midnight'
}, {
  label: 'Daily at 3 AM',
  expression: '0 3 * * *',
  description: 'Runs every day at 3:00 AM'
}, {
  label: 'Weekly (Sunday 2 AM)',
  expression: '0 2 * * 0',
  description: 'Runs every Sunday at 2:00 AM'
}, {
  label: 'Monthly (1st at 1 AM)',
  expression: '0 1 1 * *',
  description: 'Runs on the 1st of every month at 1:00 AM'
}];
export default function ScheduledJobsPage() {
  useDocumentTitle("Scheduled Jobs • WinMix TipsterHub");
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<JobSummary | null>(null);
  const [logsOpen, setLogsOpen] = useState(false);
  const [toggleJobId, setToggleJobId] = useState<string | null>(null);
  const [runJobId, setRunJobId] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedJobForEdit, setSelectedJobForEdit] = useState<JobSummary | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [showInactive, setShowInactive] = useState(false);
  const jobsQuery = useQuery<JobSummary[]>({
    queryKey: ["scheduled-jobs"],
    queryFn: fetchJobs,
    refetchInterval: 30000,
    refetchIntervalInBackground: false
  });
  const createMutation = useMutation({
    mutationFn: createJob,
    onSuccess: () => {
      toast.success("Job created successfully");
      queryClient.invalidateQueries({
        queryKey: ["scheduled-jobs"]
      });
      setIsCreateDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      data
    }: {
      id: string;
      data: Partial<JobFormData>;
    }) => updateJob(id, data),
    onSuccess: () => {
      toast.success("Job updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["scheduled-jobs"]
      });
      setIsEditDialogOpen(false);
      setSelectedJobForEdit(null);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      toast.success("Job deleted successfully");
      queryClient.invalidateQueries({
        queryKey: ["scheduled-jobs"]
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    }
  });
  const fetchLogs = async (): Promise<JobLog[]> => {
    if (!selectedJob) return [];
    const {
      data,
      error
    } = await supabase.functions.invoke<JobLogsResponse>("jobs-logs", {
      body: {
        jobId: selectedJob.id,
        limit: 50
      }
    });
    if (error) {
      throw new Error(error.message ?? "Failed to fetch execution logs");
    }
    return data?.logs ?? [];
  };
  const logsQuery = useQuery<JobLog[]>({
    queryKey: ["job-logs", selectedJob?.id],
    queryFn: fetchLogs,
    enabled: logsOpen && Boolean(selectedJob),
    refetchOnWindowFocus: false,
    onError: err => {
      const message = err instanceof Error ? err.message : "Failed to load logs";
      toast.error(message);
    }
  });
  const toggleMutation = useMutation<JobSummary | undefined, Error, {
    jobId: string;
    enabled: boolean;
  }>({
    mutationFn: async ({
      jobId,
      enabled
    }) => {
      const {
        data,
        error
      } = await supabase.functions.invoke<JobToggleResponse>("jobs-toggle", {
        body: {
          jobId,
          enabled
        }
      });
      if (error) {
        throw new Error(error.message ?? "Failed to update job status");
      }
      return data?.job;
    },
    onMutate: ({
      jobId
    }) => {
      setToggleJobId(jobId);
    },
    onSuccess: async (_, {
      enabled
    }) => {
      await queryClient.invalidateQueries({
        queryKey: ["scheduled-jobs"]
      });
      toast.success(enabled ? "Job enabled" : "Job disabled");
    },
    onError: error => {
      toast.error(error.message || "Failed to update job");
    },
    onSettled: () => {
      setToggleJobId(null);
    }
  });
  const runMutation = useMutation<JobTriggerResponse["result"], Error, {
    jobId: string;
    force?: boolean;
  }>({
    mutationFn: async ({
      jobId,
      force
    }) => {
      const {
        data,
        error
      } = await supabase.functions.invoke<JobTriggerResponse>("jobs-trigger", {
        body: {
          jobId,
          force
        }
      });
      if (error) {
        throw new Error(error.message ?? "Failed to run job");
      }
      if (!data?.result) {
        throw new Error("No response received from job execution");
      }
      return data.result;
    },
    onMutate: ({
      jobId
    }) => {
      setRunJobId(jobId);
    },
    onSuccess: async (result, {
      jobId
    }) => {
      await queryClient.invalidateQueries({
        queryKey: ["scheduled-jobs"]
      });
      if (selectedJob?.id === jobId) {
        await queryClient.invalidateQueries({
          queryKey: ["job-logs", jobId]
        });
      }
      toast.success(`Job execution completed – ${result.recordsProcessed} records processed.`);
    },
    onError: error => {
      toast.error(error.message || "Failed to run job");
    },
    onSettled: () => {
      setRunJobId(null);
    }
  });
  const [formData, setFormData] = useState<JobFormData>({
    job_name: "",
    job_type: "data_import",
    cron_schedule: "0 3 * * *",
    enabled: true,
    config: {}
  });
  const resetForm = () => {
    setFormData({
      job_name: "",
      job_type: "data_import",
      cron_schedule: "0 3 * * *",
      enabled: true,
      config: {}
    });
  };
  const handleEdit = (job: JobSummary) => {
    setSelectedJobForEdit(job);
    setFormData({
      job_name: job.job_name,
      job_type: job.job_type as JobType,
      cron_schedule: job.cron_schedule,
      enabled: job.enabled,
      config: job.config || {}
    });
    setIsEditDialogOpen(true);
  };
  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this job?")) {
      deleteMutation.mutate(id);
    }
  };
  const handleViewLogs = (job: JobSummary) => {
    setSelectedJob(job);
    setLogsOpen(true);
  };
  const handleCloseLogs = (open: boolean) => {
    setLogsOpen(open);
    if (!open) {
      setSelectedJob(null);
    }
  };
  const filteredJobs = useMemo(() => {
    const jobs = jobsQuery.data ?? [];
    return jobs.filter(job => {
      const matchesSearch = job.job_name.toLowerCase().includes(searchTerm.toLowerCase()) || job.job_type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = selectedType === "all" || job.job_type === selectedType;
      const matchesActive = showInactive || job.enabled;
      return matchesSearch && matchesType && matchesActive;
    });
  }, [jobsQuery.data, searchTerm, selectedType, showInactive]);
  const stats = useMemo(() => {
    const jobs = jobsQuery.data ?? [];
    return {
      total: jobs.length,
      enabled: jobs.filter(j => j.enabled).length,
      disabled: jobs.filter(j => !j.enabled).length,
      due: jobs.filter(j => j.is_due).length,
      running: jobs.filter(j => j.last_log?.status === 'running').length
    };
  }, [jobsQuery.data]);
  const getJobStatusBadge = (job: JobSummary) => {
    if (!job.enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    if (job.is_due) {
      return <Badge variant="destructive">Due</Badge>;
    }
    if (job.last_log?.status === 'running') {
      return <Badge variant="default">Running</Badge>;
    }
    return <Badge variant="outline">Scheduled</Badge>;
  };
  const skeletonCards = useMemo(() => <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {[1, 2, 3, 4].map(item => <Skeleton key={item} className="h-64 w-full" />)}
    </div>, []);
  return <AuthGate allowedRoles={['admin', 'analyst']}>
      <PageLayout>
        <PageHeader title="Scheduled Jobs" description="Automated task scheduling and management" actions={<>
              <Button variant="outline" size="sm" onClick={() => void jobsQuery.refetch()} disabled={jobsQuery.isFetching} className="inline-flex items-center gap-2">
                <RefreshCcw className={cn("w-4 h-4", jobsQuery.isFetching ? "animate-spin" : "")} />
                Refresh
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Job
              </Button>
            </>} />

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Job</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="job-name">Job Name</Label>
                <Input id="job-name" value={formData.job_name} onChange={e => setForm(f => ({
                ...f,
                job_name: e.target.value
              }))} placeholder="daily_data_import" />
              </div>
              <div>
                <Label htmlFor="job-type">Job Type</Label>
                <Select value={formData.job_type} onValueChange={value => setForm(f => ({
                ...f,
                job_type: value as JobType
              }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select job type" />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_TYPES.map(type => <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="cron-schedule">Cron Schedule</Label>
                <Input id="cron-schedule" value={formData.cron_schedule} onChange={e => setForm(f => ({
                ...f,
                cron_schedule: e.target.value
              }))} placeholder="0 3 * * *" />
                <div className="mt-2">
                  <Label className="text-xs text-muted-foreground">Quick Presets:</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {CRON_PRESETS.slice(0, 4).map(preset => <Button key={preset.expression} type="button" variant="outline" size="sm" onClick={() => setForm(f => ({
                    ...f,
                    cron_schedule: preset.expression
                  }))} className="text-xs">
                        {preset.label}
                      </Button>)}
                  </div>
                </div>
              </div>
              <div>
                <Label htmlFor="config">Configuration (JSON)</Label>
                <Textarea id="config" value={JSON.stringify(formData.config, null, 2)} onChange={e => {
                try {
                  const config = JSON.parse(e.target.value);
                  setForm(f => ({
                    ...f,
                    config
                  }));
                } catch {
                  // Invalid JSON, don't update
                }
              }} placeholder='{"source": "api", "batch_size": 100}' rows={4} />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="enabled" checked={formData.enabled} onCheckedChange={checked => setForm(f => ({
                ...f,
                enabled: checked
              }))} />
                <Label htmlFor="enabled">Enabled</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => createMutation.mutate(formData)} disabled={createMutation.isPending || !formData.job_name || !formData.cron_schedule}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Jobs</CardTitle>
                  <Settings className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enabled</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-500">{stats.enabled}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Disabled</CardTitle>
                  <Pause className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-500">{stats.disabled}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Due</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-500">{stats.due}</div>
                </CardContent>
              </Card>
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Running</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-500">{stats.running}</div>
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <Card className="bg-card/60 border-border/80 backdrop-blur mb-6">
              <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input placeholder="Search jobs..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger>
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {JOB_TYPES.map(type => <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="show-inactive" checked={showInactive} onCheckedChange={setShowInactive} />
                    <Label htmlFor="show-inactive">Show Disabled</Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {jobsQuery.error && <Alert variant="destructive" className="mb-6">
                <AlertDescription>{(jobsQuery.error as Error).message}</AlertDescription>
              </Alert>}

            {jobsQuery.isLoading ? skeletonCards : filteredJobs.length === 0 ? <div className="rounded-lg border border-border/60 bg-muted/20 p-12 text-center text-muted-foreground">
                No jobs found.
              </div> : <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {filteredJobs.map(job => <JobStatusCard key={job.id} job={job} onToggle={enabled => toggleMutation.mutate({
          jobId: job.id,
          enabled
        })} onRun={() => runMutation.mutate({
          jobId: job.id,
          force: !job.enabled
        })} onViewLogs={() => handleViewLogs(job)} onEdit={() => handleEdit(job)} onDelete={() => handleDelete(job.id)} isToggling={toggleJobId === job.id && toggleMutation.isPending} isRunning={runJobId === job.id && runMutation.isPending} />)}
              </div>}

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Job</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="edit-job-name">Job Name</Label>
                    <Input id="edit-job-name" value={formData.job_name} onChange={e => setForm(f => ({
                ...f,
                job_name: e.target.value
              }))} placeholder="daily_data_import" />
                  </div>
                  <div>
                    <Label htmlFor="edit-job-type">Job Type</Label>
                    <Select value={formData.job_type} onValueChange={value => setForm(f => ({
                ...f,
                job_type: value as JobType
              }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select job type" />
                      </SelectTrigger>
                      <SelectContent>
                        {JOB_TYPES.map(type => <SelectItem key={type.value} value={type.value}>
                            <div>
                              <div className="font-medium">{type.label}</div>
                              <div className="text-xs text-muted-foreground">{type.description}</div>
                            </div>
                          </SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="edit-cron-schedule">Cron Schedule</Label>
                    <Input id="edit-cron-schedule" value={formData.cron_schedule} onChange={e => setForm(f => ({
                ...f,
                cron_schedule: e.target.value
              }))} placeholder="0 3 * * *" />
                  </div>
                  <div>
                    <Label htmlFor="edit-config">Configuration (JSON)</Label>
                    <Textarea id="edit-config" value={JSON.stringify(formData.config, null, 2)} onChange={e => {
                try {
                  const config = JSON.parse(e.target.value);
                  setForm(f => ({
                    ...f,
                    config
                  }));
                } catch {
                  // Invalid JSON, don't update
                }
              }} placeholder='{"source": "api", "batch_size": 100}' rows={4} />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="edit-enabled" checked={formData.enabled} onCheckedChange={checked => setForm(f => ({
                ...f,
                enabled: checked
              }))} />
                    <Label htmlFor="edit-enabled">Enabled</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => selectedJobForEdit && updateMutation.mutate({
              id: selectedJobForEdit.id,
              data: formData
            })} disabled={updateMutation.isPending || !formData.job_name || !formData.cron_schedule}>
                    Update
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <JobLogsDialog open={logsOpen} onOpenChange={handleCloseLogs} job={selectedJob} logs={logsQuery.data ?? []} isLoading={logsQuery.isLoading} onRefresh={() => void logsQuery.refetch()} />
      </PageLayout>
    </AuthGate>;
}