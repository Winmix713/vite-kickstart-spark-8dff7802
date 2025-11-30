// Re-export the centralized environment configuration
// This prevents duplicate validation and keeps a single source of truth
export { env, phaseFlags } from '@/config/env';

// Legacy type export for backwards compatibility
export type Env = {
  VITE_SUPABASE_PROJECT_ID?: string;
  VITE_SUPABASE_URL: string;
  VITE_SUPABASE_ANON_KEY: string;
  VITE_ENV?: 'development' | 'production' | 'staging';
};