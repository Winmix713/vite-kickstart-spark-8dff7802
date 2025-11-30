import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';
export interface TableStats {
  table: string;
  count: number;
  lastUpdated: string | null;
}
export interface SystemMetrics {
  totalUsers: number;
  totalMatches: number;
  totalPredictions: number;
  totalModels: number;
  activeJobs: number;
}
export async function getTableStats(tableName: string): Promise<TableStats> {
  try {
    const {
      count,
      error
    } = await supabase.from(tableName).select('*', {
      count: 'exact',
      head: true
    });
    if (error) throw error;
    let lastUpdated: string | null = null;
    try {
      const {
        data: latestRow
      } = await supabase.from(tableName).select('updated_at, created_at').order('updated_at', {
        ascending: false
      }).limit(1).single();
      if (latestRow) {
        lastUpdated = latestRow.updated_at || latestRow.created_at;
      }
    } catch {
      logger.debug('Could not fetch last updated time', {
        tableName
      }, 'AdminUtils');
    }
    return {
      table: tableName,
      count: count || 0,
      lastUpdated
    };
  } catch (error) {
    logger.error('Error fetching table stats', error, {
      tableName
    }, 'AdminUtils');
    return {
      table: tableName,
      count: 0,
      lastUpdated: null
    };
  }
}
export async function getSystemMetrics(): Promise<SystemMetrics> {
  try {
    const [usersRes, matchesRes, predictionsRes, modelsRes, jobsRes] = await Promise.allSettled([supabase.from('user_profiles').select('*', {
      count: 'exact',
      head: true
    }), supabase.from('matches').select('*', {
      count: 'exact',
      head: true
    }), supabase.from('predictions').select('*', {
      count: 'exact',
      head: true
    }), supabase.from('model_registry').select('*', {
      count: 'exact',
      head: true
    }), supabase.from('scheduled_jobs').select('*', {
      count: 'exact',
      head: true
    }).eq('enabled', true)]);
    return {
      totalUsers: usersRes.status === 'fulfilled' ? usersRes.value.count || 0 : 0,
      totalMatches: matchesRes.status === 'fulfilled' ? matchesRes.value.count || 0 : 0,
      totalPredictions: predictionsRes.status === 'fulfilled' ? predictionsRes.value.count || 0 : 0,
      totalModels: modelsRes.status === 'fulfilled' ? modelsRes.value.count || 0 : 0,
      activeJobs: jobsRes.status === 'fulfilled' ? jobsRes.value.count || 0 : 0
    };
  } catch (error) {
    logger.error('Error fetching system metrics', error, {}, 'AdminUtils');
    return {
      totalUsers: 0,
      totalMatches: 0,
      totalPredictions: 0,
      totalModels: 0,
      activeJobs: 0
    };
  }
}
export async function bulkUpdate<T extends Record<string, unknown>>(tableName: string, updates: Array<{
  id: string;
  data: Partial<T>;
}>): Promise<{
  success: number;
  failed: number;
}> {
  let success = 0;
  let failed = 0;
  await Promise.allSettled(updates.map(async ({
    id,
    data
  }) => {
    const {
      error
    } = await supabase.from(tableName).update(data).eq('id', id);
    if (error) {
      logger.error('Bulk update item failed', error, {
        tableName,
        id
      }, 'AdminUtils');
      failed++;
    } else {
      success++;
    }
  }));
  return {
    success,
    failed
  };
}
export async function validateDatabaseConnection(): Promise<{
  connected: boolean;
  latency: number;
  error?: string;
}> {
  const start = performance.now();
  try {
    const {
      error
    } = await supabase.from('leagues').select('id').limit(1);
    const latency = Math.round(performance.now() - start);
    if (error) {
      return {
        connected: false,
        latency,
        error: error.message
      };
    }
    return {
      connected: true,
      latency
    };
  } catch (error) {
    const latency = Math.round(performance.now() - start);
    logger.error('Database connection validation failed', error, {}, 'AdminUtils');
    return {
      connected: false,
      latency,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${(ms / 60000).toFixed(1)}m`;
  return `${(ms / 3600000).toFixed(1)}h`;
}
export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round((current - previous) / previous * 100);
}
export async function getRecentActivity(limit: number = 10): Promise<Array<{
  type: string;
  description: string;
  timestamp: string;
}>> {
  try {
    const {
      data,
      error
    } = await supabase.from('audit_log').select('*').order('created_at', {
      ascending: false
    }).limit(limit);
    if (error) throw error;
    return (data || []).map(log => ({
      type: log.action_type || 'unknown',
      description: log.description || 'No description',
      timestamp: log.created_at
    }));
  } catch (error) {
    logger.error('Error fetching recent activity', error, {}, 'AdminUtils');
    return [];
  }
}