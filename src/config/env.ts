// Safely access environment variables with proper fallbacks
const getEnv = () => {
  if (typeof import.meta === 'undefined' || !import.meta.env) {
    return {};
  }
  return import.meta.env;
};

const envVars = getEnv();

export const env = {
  mode: envVars.MODE || 'production',
  isDev: envVars.MODE === 'development',
  isProd: envVars.MODE === 'production',
  isTest: envVars.MODE === 'test',
  supabase: {
    projectId: envVars.VITE_SUPABASE_PROJECT_ID || '',
    url: envVars.VITE_SUPABASE_URL || '',
    anonKey: envVars.VITE_SUPABASE_ANON_KEY || envVars.VITE_SUPABASE_PUBLISHABLE_KEY || ''
  },
  oddsApi: {
    key: envVars.VITE_ODDS_API_KEY || ''
  }
};

// API Origins configuration
export const apiOrigins = {
  local: 'http://localhost:3000',
  development: 'https://dev.api.example.com',
  production: 'https://api.example.com'
};

// Feature flags configuration
export const phaseFlags = {
  phase5: envVars.VITE_ENABLE_PHASE5 === 'true',
  phase6: envVars.VITE_ENABLE_PHASE6 === 'true',
  phase7: envVars.VITE_ENABLE_PHASE7 === 'true',
  phase8: envVars.VITE_ENABLE_PHASE8 === 'true',
  phase9: envVars.VITE_ENABLE_PHASE9 === 'true',
  // Add your feature flags here
  // Example:
  // enableNewFeature: envVars.VITE_ENABLE_NEW_FEATURE === 'true',
  // showBetaFeatures: envVars.VITE_SHOW_BETA_FEATURES === 'true',
};

// Helper to check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  return !!(env.supabase.url && env.supabase.anonKey);
};

// Validation - only run once in browser, not during tests
let validationRun = false;

if (typeof window !== 'undefined' && !env.isTest && !validationRun) {
  validationRun = true;
  
  // Run validation after a small delay to ensure env vars are loaded
  setTimeout(() => {
    const missing: string[] = [];
    
    // Re-check env vars after delay
    const currentEnv = getEnv();
    const hasProjectId = currentEnv.VITE_SUPABASE_PROJECT_ID;
    const hasUrl = currentEnv.VITE_SUPABASE_URL;
    const hasAnonKey = currentEnv.VITE_SUPABASE_ANON_KEY || currentEnv.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    if (!hasProjectId) missing.push('VITE_SUPABASE_PROJECT_ID');
    if (!hasUrl) missing.push('VITE_SUPABASE_URL');
    if (!hasAnonKey) missing.push('VITE_SUPABASE_ANON_KEY');
    
    if (missing.length > 0) {
      console.warn('⚠️ Missing Supabase environment variables:', missing.join(', '));
      console.warn('ℹ️ The app will run in demo mode with mock data.');
      console.warn('ℹ️ To fix: Ensure your .env file has these variables and restart the dev server.');
    } else if (env.isDev) {
      console.log('✅ Environment variables loaded successfully');
    }
  }, 100);
}