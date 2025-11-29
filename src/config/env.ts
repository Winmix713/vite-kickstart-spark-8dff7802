import { z } from "zod";

// Enhanced environment validation for frontend core shell
const envSchema = z.object({
  // Supabase Configuration
  VITE_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  VITE_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  
  // Environment
  VITE_ENV: z.enum(["development", "production", "staging"]).default("development"),
  
  // Feature Flags (Phase 5-9)
  VITE_FEATURE_PHASE5: z.string().transform((val) => val === "true").default("false"),
  VITE_FEATURE_PHASE6: z.string().transform((val) => val === "true").default("false"),
  VITE_FEATURE_PHASE7: z.string().transform((val) => val === "true").default("false"),
  VITE_FEATURE_PHASE8: z.string().transform((val) => val === "true").default("false"),
  VITE_FEATURE_PHASE9: z.string().transform((val) => val === "true").default("false"),
  
  // API Origins
  VITE_API_ORIGIN: z.string().url().optional(),
  VITE_EDGE_FUNCTION_ORIGIN: z.string().url().optional(),
  
  // Phase 9 Configuration
  VITE_ODDS_API_KEY: z.string().optional(),
  VITE_ODDS_API_BASE_URL: z.string().url().optional(),
  VITE_ODDS_API_RATE_LIMIT: z.string().transform(Number).default("500"),
  
  // Observability
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_SENTRY_ENV: z.string().optional(),
  VITE_CLOUDFLARE_BEACON_TOKEN: z.string().optional(),
  
  // AI Chat
  VITE_OPENAI_API_KEY: z.string().optional(),
  VITE_OPENAI_MODEL: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

// Build raw environment object
const rawEnv: Record<keyof Env, unknown> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_ENV: import.meta.env.VITE_ENV,
  VITE_FEATURE_PHASE5: import.meta.env.VITE_FEATURE_PHASE5,
  VITE_FEATURE_PHASE6: import.meta.env.VITE_FEATURE_PHASE6,
  VITE_FEATURE_PHASE7: import.meta.env.VITE_FEATURE_PHASE7,
  VITE_FEATURE_PHASE8: import.meta.env.VITE_FEATURE_PHASE8,
  VITE_FEATURE_PHASE9: import.meta.env.VITE_FEATURE_PHASE9,
  VITE_API_ORIGIN: import.meta.env.VITE_API_ORIGIN,
  VITE_EDGE_FUNCTION_ORIGIN: import.meta.env.VITE_EDGE_FUNCTION_ORIGIN,
  VITE_ODDS_API_KEY: import.meta.env.VITE_ODDS_API_KEY,
  VITE_ODDS_API_BASE_URL: import.meta.env.VITE_ODDS_API_BASE_URL,
  VITE_ODDS_API_RATE_LIMIT: import.meta.env.VITE_ODDS_API_RATE_LIMIT,
  VITE_SENTRY_DSN: import.meta.env.VITE_SENTRY_DSN,
  VITE_SENTRY_ENV: import.meta.env.VITE_SENTRY_ENV,
  VITE_CLOUDFLARE_BEACON_TOKEN: import.meta.env.VITE_CLOUDFLARE_BEACON_TOKEN,
  VITE_OPENAI_API_KEY: import.meta.env.VITE_OPENAI_API_KEY,
  VITE_OPENAI_MODEL: import.meta.env.VITE_OPENAI_MODEL,
};

// Validate environment
const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  const formatted = parsedEnv.error.flatten();
  console.error("❌ Invalid environment variables:", formatted.fieldErrors);
  
  // In development, show detailed errors
  if (import.meta.env.DEV) {
    console.table(formatted.fieldErrors);
    throw new Error(`
Invalid environment configuration. Please check your .env file:

${Object.entries(formatted.fieldErrors)
  .map(([field, errors]) => `- ${field}: ${errors?.join(", ")}`)
  .join("\n")}

See .env.example for required variables.
    `);
  }
  
  throw new Error("Invalid environment configuration. Please check your .env file.");
}

// Export validated environment
export const env: Readonly<Env> = Object.freeze(parsedEnv.data);

// Helper functions for common checks
export const isDev = () => env.VITE_ENV === "development";
export const isProd = () => env.VITE_ENV === "production";
export const isStaging = () => env.VITE_ENV === "staging";

// Feature flag helpers
export const phaseFlags = {
  phase5: env.VITE_FEATURE_PHASE5,
  phase6: env.VITE_FEATURE_PHASE6,
  phase7: env.VITE_FEATURE_PHASE7,
  phase8: env.VITE_FEATURE_PHASE8,
  phase9: env.VITE_FEATURE_PHASE9,
} as const;

// API origins
export const apiOrigins = {
  supabase: env.VITE_SUPABASE_URL,
  api: env.VITE_API_ORIGIN || env.VITE_SUPABASE_URL,
  edgeFunctions: env.VITE_EDGE_FUNCTION_ORIGIN || `${env.VITE_SUPABASE_URL}/functions/v1`,
} as const;

export type { Env };