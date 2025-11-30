import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Safely access environment variables
const getEnvVars = () => {
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return {
      url: '',
      anonKey: ''
    };
  }
  const env = import.meta.env;
  return {
    url: env.VITE_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: env.VITE_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY || ''
  };
};
const {
  url,
  anonKey
} = getEnvVars();

// Validate that we have the required environment variables
const hasValidConfig = url && anonKey && url !== '' && anonKey !== '';

// Helper to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return hasValidConfig;
};

// Log configuration status (only in development)
if (typeof window !== 'undefined' && import.meta.env?.MODE === 'development') {
  if (hasValidConfig) {
    console.log('✅ Supabase client configured:', url.substring(0, 30) + '...');
  } else {
    console.warn('⚠️ Supabase client not configured - using placeholder values');
    console.warn('Missing:', !url ? 'VITE_SUPABASE_URL' : '', !anonKey ? 'VITE_SUPABASE_ANON_KEY' : '');
  }
}

// Create the Supabase client with actual values or safe placeholders
export const supabase = createClient<Database>(hasValidConfig ? url : 'https://placeholder.supabase.co', hasValidConfig ? anonKey : 'placeholder-key', {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Export a safe version that checks configuration before use
export const getSupabaseClient = () => {
  if (!hasValidConfig) {
    console.warn('Supabase client accessed but not properly configured');
    return null;
  }
  return supabase;
};