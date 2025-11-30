import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { JobSummary } from "@/types/jobs";
import type { AdminJobsManagerResult, UseJobsOptions } from "@/types/admin";
import { useAuditLog } from "@/hooks/admin/useAuditLog";
const JOBS_QUERY_KEY = ["admin", "jobs"] as const;
const fetchJobs = async (): Promise<JobSummary[]> => {
  const {
    data,
    error
  } = await supabase.functions.invoke<{
    jobs: JobSummary[];
  }>("jobs-list");
  if (error) {
    throw new Error(error.message ?? "Failed to load jobs");
  }
  return data?.jobs ?? [];
};
const invokeJobsManager = async (body: Record<string, unknown>) => {
  const {
    data,
    error
  } = await supabase.functions.invoke<AdminJobsManagerResult>("jobs-manager", {
    body
  });
  if (error) {
    throw new Error(error.message ?? "Jobs manager call failed");
  }
  return data;
};
export const useJobs = (options: UseJobsOptions = {}) => {
  const {
    log
  } = useAuditLog();
  const queryClient = useQueryClient();
  const jobsQuery = useQuery<JobSummary[]>({
    queryKey: JOBS_QUERY_KEY,
    queryFn: fetchJobs,
    refetchInterval: options.refetchInterval ?? 45_000,
    enabled: options.enabled ?? true
  });
  const startMutation = useMutation<AdminJobsManagerResult, Error, string>({
    mutationFn: async jobName => invokeJobsManager({
      action: "start",
      jobName
    }),
    onSuccess: async (result, jobName) => {
      toast.success(`Job "${jobName}" started`);
      await log("job_started", {
        jobName,
        jobId: result.job?.id ?? result.jobId ?? null
      });
      await queryClient.invalidateQueries({
        queryKey: JOBS_QUERY_KEY
      });
    },
    onError: (error, jobName) => {
      toast.error(`Failed to start job "${jobName}": ${error.message}`);
    }
  });
  const stopMutation = useMutation<AdminJobsManagerResult, Error, string>({
    mutationFn: async jobId => invokeJobsManager({
      action: "stop",
      jobId
    }),
    onSuccess: async (result, jobId) => {
      toast.success("Job stopped");
      await log("job_stopped", {
        jobId,
        status: result.status ?? null
      });
      await queryClient.invalidateQueries({
        queryKey: JOBS_QUERY_KEY
      });
    },
    onError: error => {
      toast.error(`Failed to stop job: ${error.message}`);
    }
  });
  return {
    jobs: jobsQuery.data ?? [],
    isLoading: jobsQuery.isLoading,
    isFetching: jobsQuery.isFetching,
    error: jobsQuery.error as Error | null,
    refetch: jobsQuery.refetch,
    startJob: startMutation.mutateAsync,
    stopJob: stopMutation.mutateAsync,
    isStarting: startMutation.isPending,
    isStopping: stopMutation.isPending
  };
};