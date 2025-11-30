import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';
export interface QueryCache {
  data: unknown;
  timestamp: number;
  ttl: number;
}
class ConnectionPoolManager {
  private cache: Map<string, QueryCache> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000;
  getCacheKey(table: string, options?: Record<string, unknown>): string {
    return `${table}:${JSON.stringify(options || {})}`;
  }
  getCached<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (!cached) return null;
    const now = Date.now();
    if (now - cached.timestamp > cached.ttl) {
      this.cache.delete(key);
      return null;
    }
    return cached.data as T;
  }
  setCache(key: string, data: unknown, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    });
  }
  clearCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }
    const keys = Array.from(this.cache.keys());
    keys.forEach(key => {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    });
  }
  async healthCheck(): Promise<boolean> {
    try {
      const {
        error
      } = await supabase.from('leagues').select('id').limit(1);
      return !error;
    } catch (error) {
      logger.error('Health check failed', error, {}, 'ConnectionPool');
      return false;
    }
  }
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}
export const connectionPool = new ConnectionPoolManager();
export default connectionPool;