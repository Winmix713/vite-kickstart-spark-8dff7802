import { supabase } from '@/integrations/supabase/client';
import logger from '@/lib/logger';
import { adminConnectionManager } from './admin-connection-manager';
export interface AdminServiceOptions {
  useCache?: boolean;
  cacheTTL?: number;
}
export class AdminAPIService {
  private static instance: AdminAPIService;
  private constructor() {}
  static getInstance(): AdminAPIService {
    if (!AdminAPIService.instance) {
      AdminAPIService.instance = new AdminAPIService();
    }
    return AdminAPIService.instance;
  }
  async getUsers(options: AdminServiceOptions = {}) {
    const {
      useCache = true,
      cacheTTL
    } = options;
    if (useCache) {
      return adminConnectionManager.fetchWithCache('user_profiles', query => query.select('*').order('created_at', {
        ascending: false
      }), {
        ttl: cacheTTL
      });
    }
    const {
      data,
      error
    } = await supabase.from('user_profiles').select('*').order('created_at', {
      ascending: false
    });
    if (error) {
      logger.error('Failed to fetch users', error, {}, 'AdminAPIService');
      return null;
    }
    return data;
  }
  async getModels(options: AdminServiceOptions = {}) {
    const {
      useCache = true,
      cacheTTL
    } = options;
    if (useCache) {
      return adminConnectionManager.fetchWithCache('model_registry', query => query.select('*').order('registered_at', {
        ascending: false
      }), {
        ttl: cacheTTL
      });
    }
    const {
      data,
      error
    } = await supabase.from('model_registry').select('*').order('registered_at', {
      ascending: false
    });
    if (error) {
      logger.error('Failed to fetch models', error, {}, 'AdminAPIService');
      return null;
    }
    return data;
  }
  async getMatches(limit?: number, options: AdminServiceOptions = {}) {
    const {
      useCache = true,
      cacheTTL
    } = options;
    if (useCache) {
      return adminConnectionManager.fetchWithCache('matches', query => {
        let q = query.select(`
            *,
            home_team:teams!matches_home_team_id_fkey(id, name),
            away_team:teams!matches_away_team_id_fkey(id, name)
          `).order('match_date', {
          ascending: false
        });
        if (limit) {
          q = q.limit(limit);
        }
        return q;
      }, {
        ttl: cacheTTL,
        cacheKey: `matches:${limit || 'all'}`
      });
    }
    let query = supabase.from('matches').select(`
        *,
        home_team:teams!matches_home_team_id_fkey(id, name),
        away_team:teams!matches_away_team_id_fkey(id, name)
      `).order('match_date', {
      ascending: false
    });
    if (limit) {
      query = query.limit(limit);
    }
    const {
      data,
      error
    } = await query;
    if (error) {
      logger.error('Failed to fetch matches', error, {
        limit
      }, 'AdminAPIService');
      return null;
    }
    return data;
  }
  async getJobs(options: AdminServiceOptions = {}) {
    const {
      useCache = true,
      cacheTTL = 30000
    } = options;
    if (useCache) {
      return adminConnectionManager.fetchWithCache('scheduled_jobs', query => query.select('*').order('created_at', {
        ascending: false
      }), {
        ttl: cacheTTL
      });
    }
    const {
      data,
      error
    } = await supabase.from('scheduled_jobs').select('*').order('created_at', {
      ascending: false
    });
    if (error) {
      logger.error('Failed to fetch jobs', error, {}, 'AdminAPIService');
      return null;
    }
    return data;
  }
  async updateUser(userId: string, updates: Record<string, unknown>) {
    try {
      const {
        data,
        error
      } = await supabase.from('user_profiles').update(updates).eq('id', userId).select().single();
      if (error) throw error;
      await adminConnectionManager.invalidateCache('user_profiles');
      logger.info('User updated successfully', {
        userId
      }, 'AdminAPIService');
      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error('Failed to update user', error, {
        userId,
        updates
      }, 'AdminAPIService');
      return {
        success: false,
        error
      };
    }
  }
  async deleteUser(userId: string) {
    try {
      const {
        error
      } = await supabase.from('user_profiles').delete().eq('id', userId);
      if (error) throw error;
      await adminConnectionManager.invalidateCache('user_profiles');
      logger.info('User deleted successfully', {
        userId
      }, 'AdminAPIService');
      return {
        success: true
      };
    } catch (error) {
      logger.error('Failed to delete user', error, {
        userId
      }, 'AdminAPIService');
      return {
        success: false,
        error
      };
    }
  }
  async updateModel(modelId: string, updates: Record<string, unknown>) {
    try {
      const {
        data,
        error
      } = await supabase.from('model_registry').update(updates).eq('id', modelId).select().single();
      if (error) throw error;
      await adminConnectionManager.invalidateCache('model_registry');
      logger.info('Model updated successfully', {
        modelId
      }, 'AdminAPIService');
      return {
        success: true,
        data
      };
    } catch (error) {
      logger.error('Failed to update model', error, {
        modelId,
        updates
      }, 'AdminAPIService');
      return {
        success: false,
        error
      };
    }
  }
  async invalidateAllCaches() {
    await adminConnectionManager.invalidateCache();
    logger.info('All caches invalidated', {}, 'AdminAPIService');
  }
  async getHealthStatus() {
    return adminConnectionManager.checkHealth();
  }
}
export const adminAPIService = AdminAPIService.getInstance();
export default adminAPIService;