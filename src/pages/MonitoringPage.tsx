import React, { useEffect, useMemo, useState, Component } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { RefreshCcw, AlertTriangle, CheckCircle, XCircle, Activity, Database, Cpu, HardDrive, Wifi, Shield, Settings, ExternalLink, Clock, TrendingUp, TrendingDown, Info, Loader2, PlayCircle } from 'lucide-react';
import Sidebar from '@/components/navigation/Sidebar';
import TopBar from '@/components/TopBar';
import AuthGate from '@/components/AuthGate';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import SystemHealthCard from '@/components/monitoring/SystemHealthCard';
import PerformanceMetricsChart, { MetricsPoint } from '@/components/monitoring/PerformanceMetricsChart';
import ComputationMapDashboard from '@/components/monitoring/ComputationMapDashboard';
import { PredictionDecayCard } from '@/components/monitoring/PredictionDecayCard';
import { PredictionConfidenceChart } from '@/components/admin/model-status/PredictionConfidenceChart';
import { supabase } from '@/integrations/supabase/client';
import type { AlertsResponse, ComputationGraphResponse, HealthSummaryResponse, MetricsResponse, PerformanceMetricRow } from '@/types/monitoring';
import type { SystemWarning, AdminQuickLink } from '@/types/admin';
import { cn } from '@/lib/utils';
const useHealth = () => useQuery<HealthSummaryResponse>({
  queryKey: ['monitoring', 'health'],
  queryFn: async () => {
    const {
      data,
      error
    } = await supabase.functions.invoke<HealthSummaryResponse>('monitoring-health');
    if (error) throw new Error(error.message);
    return data as HealthSummaryResponse;
  },
  refetchInterval: 30000
});
const useGraph = () => useQuery<ComputationGraphResponse>({
  queryKey: ['monitoring', 'graph'],
  queryFn: async () => {
    const {
      data,
      error
    } = await supabase.functions.invoke<ComputationGraphResponse>('monitoring-computation-graph');
    if (error) throw new Error(error.message);
    return data as ComputationGraphResponse;
  },
  refetchInterval: 60000
});
const useAlerts = () => useQuery<AlertsResponse>({
  queryKey: ['monitoring', 'alerts'],
  queryFn: async () => {
    const {
      data,
      error
    } = await supabase.functions.invoke<AlertsResponse>('monitoring-alerts');
    if (error) throw new Error(error.message);
    return data as AlertsResponse;
  },
  refetchInterval: 15000
});
const useMetrics = (component?: string | null) => useQuery<MetricsResponse>({
  queryKey: ['monitoring', 'metrics', component ?? 'all'],
  queryFn: async () => {
    const {
      data,
      error
    } = await supabase.functions.invoke<MetricsResponse>('monitoring-metrics', {
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
const useLatestRetrainingRun = () => useQuery({
  queryKey: ['retraining', 'latest'],
  queryFn: async () => {
    const {
      data,
      error
    } = await supabase.from('model_retraining_runs').select('*').order('started_at', {
      ascending: false
    }).limit(1).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  },
  refetchInterval: 30000
});
const useLatestRetrainSuggestion = () => useQuery({
  queryKey: ['retrain-suggestion', 'latest'],
  queryFn: async () => {
    const {
      data,
      error
    } = await supabase.from('retrain_suggestion_log').select('*').eq('status', 'pending').order('suggested_at', {
      ascending: false
    }).limit(1).single();
    if (error && error.code !== 'PGRST116') throw new Error(error.message);
    return data;
  },
  refetchInterval: 30000
});
const ADMIN_QUICK_LINKS: AdminQuickLink[] = [{
  id: '1',
  title: 'Database Status',
  description: 'PostgreSQL database performance and connections',
  url: '/admin/database',
  icon: Database,
  category: 'system'
}, {
  id: '2',
  title: 'API Documentation',
  description: 'REST API and Edge Functions documentation',
  url: '/docs/api',
  icon: ExternalLink,
  category: 'system'
}, {
  id: '3',
  title: 'Security Audit',
  description: 'Security configuration and audit logs',
  url: '/admin/security',
  icon: Shield,
  category: 'security'
}, {
  id: '4',
  title: 'Performance Logs',
  description: 'Detailed performance and error logs',
  url: '/admin/logs',
  icon: Activity,
  category: 'monitoring'
}, {
  id: '5',
  title: 'Backup Management',
  description: 'Database backups and restoration',
  url: '/admin/backups',
  icon: HardDrive,
  category: 'data'
}, {
  id: '6',
  title: 'Rate Limiting',
  description: 'API rate limits and usage statistics',
  url: '/admin/rate-limits',
  icon: Settings,
  category: 'security'
}];
export default function MonitoringPage() {
  const healthQuery = useHealth();
  const graphQuery = useGraph();
  const alertsQuery = useAlerts();
  const retrainingQuery = useLatestRetrainingRun();
  const retrainSuggestionQuery = useLatestRetrainSuggestion();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [selectedLinkCategory, setSelectedLinkCategory] = useState<string>('all');
  const [showRetrainingForm, setShowRetrainingForm] = useState(false);
  const [retrainingReason, setRetrainingReason] = useState('');
  const metricsQuery = useMetrics(selectedComponent);
  // Update selected component based on first health component
  useEffect(() => {
    if (!selectedComponent && healthQuery.data?.components?.length) {
      setSelectedComponent(healthQuery.data.components[0].component_name);
    }
  }, [healthQuery.data?.components, selectedComponent]);
  const retrainingMutation = useMutation({
    mutationFn: async () => {
      const {
        data: {
          user
        },
        error: authError
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error('Not authenticated');
      const {
        error
      } = await supabase.from('model_retraining_requests').insert({
        requested_by: user.id,
        reason: retrainingReason || 'Manual trigger from monitoring page',
        priority: 'high',
        status: 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setShowRetrainingForm(false);
      setRetrainingReason('');
      void retrainingQuery.refetch();
    }
  });
  const retrainSuggestionActionMutation = useMutation({
    mutationFn: async ({
      suggestionId,
      action,
      notes
    }: {
      suggestionId: string;
      action: 'accept' | 'dismiss';
      notes?: string;
    }) => {
      const {
        data,
        error
      } = await supabase.functions.invoke('retrain-suggestion-action', {
        body: {
          suggestionId,
          action,
          notes
        }
      });
      if (error) throw new Error(error.message);
      return data;
    },
    onSuccess: () => {
      void retrainSuggestionQuery.refetch();
      void retrainingQuery.refetch();
    }
  });
  const metricsData: MetricsPoint[] = useMemo(() => {
    const rows: PerformanceMetricRow[] = metricsQuery.data?.metrics ?? [];
    const byTime = new Map<string, MetricsPoint>();
    for (const r of rows) {
      const key = r.timestamp;
      if (!byTime.has(key)) byTime.set(key, {
        time: key
      });
      const point = byTime.get(key)!;
      if (r.metric_name === 'latency_p50') point.p50 = r.value;
      if (r.metric_name === 'latency_p95') point.p95 = r.value;
      if (r.metric_name === 'latency_p99') point.p99 = r.value;
    }
    return Array.from(byTime.values()).sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
  }, [metricsQuery.data]);
  const systemStats = useMemo(() => {
    const components = healthQuery.data?.components ?? [];
    const alerts = alertsQuery.data?.alerts ?? [];
    const healthyComponents = components.filter(c => c.status === 'healthy').length;
    const warningComponents = components.filter(c => c.status === 'warning').length;
    const errorComponents = components.filter(c => c.status === 'error').length;
    const criticalAlerts = alerts.filter(a => a.severity === 'critical').length;
    const warningAlerts = alerts.filter(a => a.severity === 'warning').length;
    return {
      totalComponents: components.length,
      healthyComponents,
      warningComponents,
      errorComponents,
      totalAlerts: alerts.length,
      criticalAlerts,
      warningAlerts,
      overallHealth: errorComponents > 0 || criticalAlerts > 0 ? 'error' : warningComponents > 0 || warningAlerts > 0 ? 'warning' : 'healthy'
    };
  }, [healthQuery.data?.components, alertsQuery.data?.alerts]);
  const systemWarnings: SystemWarning[] = useMemo(() => {
    const warnings: SystemWarning[] = [];
    const components = healthQuery.data?.components ?? [];
    const alerts = alertsQuery.data?.alerts ?? [];
    // Component-based warnings
    components.forEach(component => {
      if (component.status === 'error') {
        warnings.push({
          id: `component-error-${component.id}`,
          type: 'error',
          title: `${component.component_name} Error`,
          description: component.error_message || 'Component is experiencing errors',
          link: '/admin/components',
          linkText: 'View Details',
          timestamp: component.last_check
        });
      } else if (component.status === 'warning') {
        warnings.push({
          id: `component-warning-${component.id}`,
          type: 'warning',
          title: `${component.component_name} Warning`,
          description: component.error_message || 'Component performance degraded',
          link: '/admin/components',
          linkText: 'View Details',
          timestamp: component.last_check
        });
      }
    });
    // Alert-based warnings
    alerts.forEach(alert => {
      warnings.push({
        id: `alert-${alert.id}`,
        type: alert.severity === 'critical' ? 'error' : alert.severity,
        title: alert.message,
        description: alert.component ? `Component: ${alert.component}` : undefined,
        link: '/admin/alerts',
        linkText: 'View Alert',
        timestamp: alert.timestamp
      });
    });
    return warnings.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [healthQuery.data?.components, alertsQuery.data?.alerts]);
  const filteredLinks = useMemo(() => {
    if (selectedLinkCategory === 'all') return ADMIN_QUICK_LINKS;
    return ADMIN_QUICK_LINKS.filter(link => link.category === selectedLinkCategory);
  }, [selectedLinkCategory]);
  const isLoading = healthQuery.isLoading || graphQuery.isLoading;
  const getHealthIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Activity className="w-5 h-5 text-gray-500" />;
    }
  };
  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-500" />;
      default:
        return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };
  return <AuthGate allowedRoles={['admin', 'analyst']}>
      <div className="min-h-screen bg-black">
        <Sidebar />
        <TopBar />
        <main className="lg:ml-64 pt-16 lg:pt-0">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gradient-emerald">
                  System Monitoring
                </h1>
                <p className="text-muted-foreground">
                  Real-time system health, performance metrics, and alerts
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => {
              void healthQuery.refetch();
              void graphQuery.refetch();
              void alertsQuery.refetch();
              void metricsQuery.refetch();
            }} disabled={isLoading} className="inline-flex items-center gap-2">
                <RefreshCcw className={cn('w-4 h-4', isLoading ? 'animate-spin' : '')} />
                Refresh All
              </Button>
            </div>

            {/* System Health Overview */}
            <Card className="bg-card/60 border-border/80 backdrop-blur mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getHealthIcon(systemStats.overallHealth)}
                  System Health Overview
                  <Badge variant={systemStats.overallHealth === 'healthy' ? 'default' : systemStats.overallHealth === 'warning' ? 'secondary' : 'destructive'}>
                    {systemStats.overallHealth.toUpperCase()}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-500">
                      {systemStats.healthyComponents}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Healthy Components
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-500">
                      {systemStats.warningComponents}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Warnings
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-500">
                      {systemStats.errorComponents}
                    </div>
                    <div className="text-sm text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">
                      {systemStats.totalAlerts}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Active Alerts
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Prediction Decay Alert */}
            <div className="mb-8">
              <PredictionDecayCard />
            </div>

            {/* Critical Warnings */}
            {systemWarnings.length > 0 && <div className="space-y-4 mb-8">
                <h2 className="text-xl font-semibold text-foreground">
                  Active Warnings & Alerts
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {systemWarnings.slice(0, 6).map(warning => <Alert key={warning.id} variant={warning.type === 'error' ? 'destructive' : 'default'}>
                      <div className="flex items-start gap-3">
                        {getAlertIcon(warning.type)}
                        <div className="flex-1">
                          <div className="font-medium">{warning.title}</div>
                          {warning.description && <AlertDescription className="mt-1">
                              {warning.description}
                            </AlertDescription>}
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-muted-foreground">
                              {new Date(warning.timestamp).toLocaleString()}
                            </span>
                            {warning.link && <Button variant="outline" size="sm" asChild>
                                <a href={warning.link} className="flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  {warning.linkText}
                                </a>
                              </Button>}
                          </div>
                        </div>
                      </div>
                    </Alert>)}
                </div>
              </div>}

            {/* Component Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {(healthQuery.data?.components ?? []).map(h => <SystemHealthCard key={h.id} health={h} />)}
            </div>

            {/* Auto Reinforcement Status */}
            <Card className="border-border/60 bg-muted/20 mb-8">
              <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Model Auto Reinforcement
                  </CardTitle>
                  {retrainSuggestionQuery.data && <Badge variant="destructive" className="gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Retrain javasolt
                    </Badge>}
                </div>
                <Button onClick={() => setShowRetrainingForm(!showRetrainingForm)} variant="default" size="sm" disabled={retrainingMutation.isPending} className="gap-2">
                  <PlayCircle className="w-4 h-4" />
                  {retrainingMutation.isPending ? 'Processing...' : 'Retrain Now'}
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {showRetrainingForm && <Alert>
                    <AlertDescription className="space-y-3">
                      <div>
                        <label className="text-sm font-medium mb-2 block">
                          Reason for Retraining (optional)
                        </label>
                        <textarea className="w-full px-3 py-2 text-sm border rounded-md bg-background" placeholder="Why are you triggering retraining?" value={retrainingReason} onChange={e => setRetrainingReason(e.target.value)} rows={3} />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => retrainingMutation.mutate()} disabled={retrainingMutation.isPending} size="sm">
                          {retrainingMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Confirm Retraining
                        </Button>
                        <Button onClick={() => {
                      setShowRetrainingForm(false);
                      setRetrainingReason('');
                    }} variant="outline" size="sm">
                          Cancel
                        </Button>
                      </div>
                      {retrainingMutation.isError && <div className="text-sm text-destructive">
                          Error:{' '}
                          {retrainingMutation.error instanceof Error ? retrainingMutation.error.message : 'Unknown error'}
                        </div>}
                      {retrainingMutation.isSuccess && <div className="text-sm text-green-600">
                          ✓ Retraining request queued successfully
                        </div>}
                    </AlertDescription>
                  </Alert>}

                {/* Retrain Suggestion Alert */}
                {retrainSuggestionQuery.data && <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Retrain Suggestion</AlertTitle>
                    <AlertDescription className="space-y-3">
                      <div>
                        <p className="text-sm">
                          Model accuracy has dropped to{' '}
                          <strong>
                            {retrainSuggestionQuery.data.accuracy}%
                          </strong>{' '}
                          in the last {retrainSuggestionQuery.data.window_days}{' '}
                          days, which is below the 70% threshold.
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Suggested:{' '}
                          {new Date(retrainSuggestionQuery.data.suggested_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={() => retrainSuggestionActionMutation.mutate({
                      suggestionId: retrainSuggestionQuery.data.id,
                      action: 'accept',
                      notes: `Accepted suggestion: Accuracy ${retrainSuggestionQuery.data.accuracy}% below 70% threshold`
                    })} disabled={retrainSuggestionActionMutation.isPending} size="sm" variant="default">
                          {retrainSuggestionActionMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Elfogadom
                        </Button>
                        <Button onClick={() => retrainSuggestionActionMutation.mutate({
                      suggestionId: retrainSuggestionQuery.data.id,
                      action: 'dismiss',
                      notes: 'Dismissed by admin'
                    })} disabled={retrainSuggestionActionMutation.isPending} size="sm" variant="outline">
                          Elutasítom
                        </Button>
                      </div>
                      {retrainSuggestionActionMutation.isError && <div className="text-sm text-destructive">
                          Error:{' '}
                          {retrainSuggestionActionMutation.error instanceof Error ? retrainSuggestionActionMutation.error.message : 'Unknown error'}
                        </div>}
                      {retrainSuggestionActionMutation.isSuccess && <div className="text-sm text-green-600">
                          ✓ Suggestion processed successfully
                        </div>}
                    </AlertDescription>
                  </Alert>}

                {retrainingQuery.data ? <div className="space-y-3">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Status</p>
                        <Badge variant={retrainingQuery.data.status === 'completed' ? 'default' : retrainingQuery.data.status === 'failed' ? 'destructive' : retrainingQuery.data.status === 'running' ? 'secondary' : 'outline'} className="gap-1 w-fit">
                          {retrainingQuery.data.status === 'running' && <Loader2 className="w-3 h-3 animate-spin" />}
                          {retrainingQuery.data.status === 'completed' && <CheckCircle className="w-3 h-3" />}
                          {retrainingQuery.data.status === 'failed' && <XCircle className="w-3 h-3" />}
                          {retrainingQuery.data.status}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Source</p>
                        <p className="text-sm font-medium">
                          {retrainingQuery.data.source}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">
                          Dataset Size
                        </p>
                        <p className="text-sm font-medium">
                          {retrainingQuery.data.dataset_size} samples
                        </p>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-muted-foreground">Started</p>
                        <p className="text-sm font-medium">
                          {new Date(retrainingQuery.data.started_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {retrainingQuery.data.metrics && Object.keys(retrainingQuery.data.metrics).length > 0 && <div className="border-t pt-3">
                          <p className="text-sm font-medium mb-2">
                            Training Metrics
                          </p>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {Object.entries(retrainingQuery.data.metrics as Record<string, number>).map(([key, value]) => <div key={key} className="bg-card/60 p-2 rounded-md">
                                <p className="text-xs text-muted-foreground capitalize">
                                  {key.replace(/_/g, ' ')}
                                </p>
                                <p className="text-sm font-semibold">
                                  {typeof value === 'number' ? value.toFixed(4) : value}
                                </p>
                              </div>)}
                          </div>
                        </div>}

                    {retrainingQuery.data.completed_at && <div className="text-xs text-muted-foreground">
                        Completed:{' '}
                        {new Date(retrainingQuery.data.completed_at).toLocaleString()}
                      </div>}
                  </div> : retrainingQuery.isLoading ? <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div> : <p className="text-sm text-muted-foreground">
                    No retraining runs yet
                  </p>}
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="border-border/60 bg-muted/20 mb-8">
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
                      {(healthQuery.data?.components ?? []).map(h => <SelectItem key={h.id} value={h.component_name}>
                          {h.component_name}
                        </SelectItem>)}
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

            {/* Prediction Confidence Chart */}
            <PredictionConfidenceChart className="mb-8" />

            {/* Quick Links */}
            <Card className="border-border/60 bg-muted/20 mb-8">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <ExternalLink className="w-5 h-5" />
                  Quick Links
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={selectedLinkCategory} onValueChange={setSelectedLinkCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="data">Data</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                      <SelectItem value="monitoring">Monitoring</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLinks.map(link => {
                  const Icon = link.icon;
                  return <Card key={link.id} className="bg-card/60 border-border/80 backdrop-blur hover:border-primary/30 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <Icon className="w-5 h-5 text-muted-foreground mt-1" />
                            <div className="flex-1">
                              <h3 className="font-medium text-foreground mb-1">
                                {link.title}
                              </h3>
                              <p className="text-sm text-muted-foreground mb-3">
                                {link.description}
                              </p>
                              <Button variant="outline" size="sm" asChild>
                                <a href={link.url} className="flex items-center gap-1">
                                  <ExternalLink className="w-3 h-3" />
                                  Open
                                </a>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>;
                })}
                </div>
              </CardContent>
            </Card>

            {/* System Resources */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    CPU Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current</span>
                      <span className="text-sm font-medium">45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      Average: 42% over last hour
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Current</span>
                      <span className="text-sm font-medium">68%</span>
                    </div>
                    <Progress value={68} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      5.4 GB / 8 GB used
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card/60 border-border/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Database className="w-5 h-5" />
                    Database
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Connections</span>
                      <span className="text-sm font-medium">12/50</span>
                    </div>
                    <Progress value={24} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      Query time: 23ms avg
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Computation Graph */}
            <ComputationMapDashboard graph={graphQuery.data ?? null} />

            {/* Recent Alerts Table */}
            <Card className="border-border/60 bg-muted/20">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(alertsQuery.data?.alerts ?? []).length === 0 ? <div className="text-muted-foreground">No recent alerts.</div> : <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Component</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(alertsQuery.data?.alerts ?? []).slice(0, 10).map(alert => <TableRow key={alert.id}>
                            <TableCell className="font-mono text-sm">
                              {new Date(alert.timestamp).toLocaleTimeString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={alert.severity === 'critical' ? 'destructive' : alert.severity === 'warning' ? 'secondary' : 'outline'}>
                                {alert.severity}
                              </Badge>
                            </TableCell>
                            <TableCell>{alert.message}</TableCell>
                            <TableCell>{alert.component || '-'}</TableCell>
                          </TableRow>)}
                    </TableBody>
                  </Table>}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </AuthGate>;
}