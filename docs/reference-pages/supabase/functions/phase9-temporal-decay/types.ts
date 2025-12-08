// Type definitions for Phase 9 Temporal Decay Edge Function

/**
 * Represents a record from the information_freshness table
 */
export interface FreshnessRecord {
  id: string
  table_name: string
  record_id: string
  data_type: string
  last_updated: string
  decay_rate: number
  freshness_score: number
  is_stale: boolean
  stale_threshold_days: number
  created_at: string
  updated_at: string
}

/**
 * Result type for create freshness record operations
 */
export interface CreateFreshnessResult {
  success: boolean
  record?: FreshnessRecord
  error?: string
}

/**
 * Result type for refresh stale record operations
 */
export interface RefreshResult {
  success: boolean
  error?: string
}

/**
 * Supabase query response wrapper
 */
export interface SupabaseResponse<T> {
  data: T | null
  error: SupabaseError | null
}

/**
 * Supabase error structure
 */
export interface SupabaseError {
  message: string
  code?: string
  details?: string
  hint?: string
}

/**
 * Supabase query builder interface
 */
export interface SupabaseQueryBuilder<T> {
  select: (columns?: string) => SupabaseQueryBuilder<T>
  insert: (data: Partial<T> | Partial<T>[]) => SupabaseQueryBuilder<T>
  update: (data: Partial<T>) => SupabaseQueryBuilder<T>
  eq: (column: string, value: unknown) => SupabaseQueryBuilder<T>
  single: () => Promise<SupabaseResponse<T>>
  then: (onfulfilled?: ((value: SupabaseResponse<T[]>) => unknown) | null) => Promise<unknown>
}

/**
 * Supabase RPC function result
 */
export interface SupabaseRPCResponse<T> {
  data: T | null
  error: SupabaseError | null
}

/**
 * Simplified Supabase client interface for type safety
 */
export interface SupabaseClient {
  from: <T = FreshnessRecord>(table: string) => SupabaseQueryBuilder<T>
  rpc: <T = number>(
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<SupabaseRPCResponse<T>>
}

/**
 * Refresh result detail for batch operations
 */
export interface RefreshResultDetail {
  recordId: string
  tableName: string
  success: boolean
  error?: string
}

/**
 * Data type mapping for freshness tracking
 */
export type DataType = 'match' | 'user_prediction' | 'odds' | 'pattern' | 'team_stats'

/**
 * Table name type for type-safe table references
 */
export type TrackedTableName = 'matches' | 'predictions' | 'market_odds' | 'patterns' | 'team_stats'

/**
 * Configuration for data type defaults
 */
export interface DataTypeConfig {
  dataType: DataType
  defaultDecayRate: number
  staleThresholdDays: number
}
