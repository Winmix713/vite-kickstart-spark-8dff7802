import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';
import { connectionPool } from './connection-pool';
export class AdminConnectionManager {
  private static instance: AdminConnectionManager;
  private constructor() {}
  static getInstance(): AdminConnectionManager {
    if (!AdminConnectionManager.instance) {
      AdminConnectionManager.instance = new AdminConnectionManager();
    }
    return AdminConnectionManager.instance;
  }
  async fetchWithCache<T>(table: string, queryBuilder: (query: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>, options?: {
    ttl?: number;
    cacheKey?: string;
  }): Promise<T | null> {
    const cacheKey = options?.cacheKey || connectionPool.getCacheKey(table);
    const cached = connectionPool.getCached<T>(cacheKey);
    if (cached) {
      logger.debug('Cache hit', {
        table,
        cacheKey
      }, 'AdminConnectionManager');
      return cached;
    }
    try {
      const query = queryBuilder(supabase.from(table));
      const {
        data,
        error
      } = await query;
      if (error) {
        logger.error('Admin query error', error, {
          table
        }, 'AdminConnectionManager');
        return null;
      }
      connectionPool.setCache(cacheKey, data, options?.ttl);
      return data as T;
    } catch (error) {
      logger.error('Admin connection error', error, {
        table
      }, 'AdminConnectionManager');
      return null;
    }
  }
  async batchFetch<T extends Record<string, unknown>>(queries: Array<{
    key: string;
    table: string;
    queryBuilder: (query: ReturnType<typeof supabase.from>) => ReturnType<typeof supabase.from>;
  }>): Promise<Record<string, unknown>> {
    const results: Record<string, unknown> = {};
    await Promise.all(queries.map(async ({
      key,
      table,
      queryBuilder
    }) => {
      const data = await this.fetchWithCache(table, queryBuilder);
      results[key] = data;
    }));
    return results;
  }
  async invalidateCache(pattern?: string): Promise<void> {
    connectionPool.clearCache(pattern);
    logger.info('Cache invalidated', {
      pattern
    }, 'AdminConnectionManager');
  }
  async checkHealth(): Promise<{
    healthy: boolean;
    cacheStats: {
      size: number;
      keys: string[];
    };
  }> {
    const healthy = await connectionPool.healthCheck();
    const cacheStats = connectionPool.getCacheStats();
    return {
      healthy,
      cacheStats
    };
  }
  async optimizeQueries<T>(table: string, columns: string[], filters?: Record<string, unknown>, options?: {
    limit?: number;
    orderBy?: string;
    ascending?: boolean;
  }): Promise<T[]> {
    const cacheKey = connectionPool.getCacheKey(table, {
      columns,
      filters,
      options
    });
    const cached = connectionPool.getCached<T[]>(cacheKey);
    if (cached) {
      return cached;
    }
    try {
      let query = supabase.from(table).select(columns.join(', '));
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            query = query.eq(key, value);
          }
        });
      }
      if (options?.orderBy) {
        query = query.order(options.orderBy, {
          ascending: options.ascending ?? true
        });
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }
      const {
        data,
        error
      } = await query;
      if (error) {
        logger.error('Optimized query error', error, {
          table,
          columns
        }, 'AdminConnectionManager');
        return [];
      }
      connectionPool.setCache(cacheKey, data);
      return data as T[] || [];
    } catch (error) {
      logger.error('Optimize queries error', error, {
        table
      }, 'AdminConnectionManager');
      return [];
    }
  }
}
export const adminConnectionManager = AdminConnectionManager.getInstance();
export default adminConnectionManager;