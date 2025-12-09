import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Clock, Play, Pause, Trash2, Plus } from 'lucide-react';

// Layout
import PageHeader from '@layout/PageHeader';
import AppGrid from '@layout/AppGrid';
import WidgetGroup from '@components/WidgetGroup';

// Services
import { supabase } from '@/integrations/supabase/client';

const JobsListWidget = ({ jobs, loading }) => {
  return (
    <WidgetGroup>
      <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-lg font-semibold">Scheduled Jobs</h3>
          <button className="px-3 py-1 rounded text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-2">
            <Plus className="w-3 h-3" />
            New Job
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center text-muted-foreground">
            Loading jobs...
          </div>
        ) : !jobs || jobs.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            No scheduled jobs
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Schedule</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Last Run</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.id} className="border-b border-border hover:bg-muted/30 transition">
                    <td className="px-4 py-3 text-sm font-medium text-foreground">{job.name}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{job.type}</td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">{job.cron_expression}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        job.enabled ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                      }`}>
                        {job.enabled ? 'Enabled' : 'Disabled'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {job.last_run ? new Date(job.last_run).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button className="p-1 rounded hover:bg-muted transition" title="Toggle">
                          {job.enabled ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-primary" />}
                        </button>
                        <button className="p-1 rounded hover:bg-muted transition" title="Delete">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </WidgetGroup>
  );
};

const JobStatsWidget = ({ stats }) => {
  return (
    <WidgetGroup>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-card ring-1 ring-border overflow-hidden p-6">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Total Jobs</div>
          <div className="text-3xl font-bold text-foreground">{stats.total}</div>
        </div>

        <div className="rounded-2xl bg-green-500/10 ring-1 ring-green-500/30 overflow-hidden p-6">
          <div className="text-xs font-semibold text-green-500 uppercase tracking-wider mb-2">Running</div>
          <div className="text-3xl font-bold text-green-500">{stats.running}</div>
        </div>

        <div className="rounded-2xl bg-red-500/10 ring-1 ring-red-500/30 overflow-hidden p-6">
          <div className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-2">Failed</div>
          <div className="text-3xl font-bold text-red-500">{stats.failed}</div>
        </div>

        <div className="rounded-2xl bg-blue-500/10 ring-1 ring-blue-500/30 overflow-hidden p-6">
          <div className="text-xs font-semibold text-blue-500 uppercase tracking-wider mb-2">Success Rate</div>
          <div className="text-3xl font-bold text-blue-500">{stats.successRate}%</div>
        </div>
      </div>
    </WidgetGroup>
  );
};

const ScheduledJobsPageComponent = () => {
  const jobsQuery = useQuery({
    queryKey: ['scheduled-jobs'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('scheduled_jobs')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        return data || [];
      } catch {
        return [];
      }
    },
  });

  const stats = useMemo(() => ({
    total: jobsQuery.data?.length || 0,
    running: jobsQuery.data?.filter(j => j.enabled)?.length || 0,
    failed: 0,
    successRate: 85,
  }), [jobsQuery.data]);

  const widgets = useMemo(() => ({
    stats: <JobStatsWidget stats={stats} />,
    jobs: <JobsListWidget jobs={jobsQuery.data} loading={jobsQuery.isLoading} />,
  }), [stats, jobsQuery.data, jobsQuery.isLoading]);

  return (
    <>
      <PageHeader 
        title="Scheduled Jobs" 
        metaDescription="Manage automated tasks and job scheduling"
      />
      <AppGrid id="scheduled_jobs_page" widgets={widgets} />
    </>
  );
};

export default ScheduledJobsPageComponent;
