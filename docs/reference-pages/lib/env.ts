import { z } from "zod";

const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, "VITE_SUPABASE_ANON_KEY is required"),
  VITE_ENV: z.enum(["development", "production", "staging"]).optional(),
});

type Env = z.infer<typeof envSchema>;

const rawEnv: Record<keyof Env, unknown> = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  VITE_ENV: import.meta.env.VITE_ENV,
};

const parsedEnv = envSchema.safeParse(rawEnv);

if (!parsedEnv.success) {
  const formatted = parsedEnv.error.flatten();
  console.error("❌ Invalid environment variables", formatted.fieldErrors);
  throw new Error("Invalid environment configuration. Please check your .env file.");
}

export const env: Readonly<Env> = Object.freeze(parsedEnv.data);
export type { Env };
