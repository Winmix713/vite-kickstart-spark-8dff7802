import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Common validation schemas
export const UuidSchema = z.string().uuid("Invalid UUID format");

export const PositiveNumberSchema = z.number().positive("Must be a positive number");

export const NonNegativeIntegerSchema = z.number().int().min(0, "Must be a non-negative integer");

export const ScoreSchema = z.number().int().min(0, "Score must be a non-negative integer");

export const ConfidenceScoreSchema = z.number().min(0).max(100, "Confidence score must be between 0 and 100");

// Prediction-related schemas
export const MatchIdSchema = z.object({
  matchId: UuidSchema,
});

export const PredictionInputSchema = z.object({
  matchId: UuidSchema,
  predictedOutcome: z.enum(["home_win", "away_win", "draw"], {
    errorMap: () => ({ message: "predictedOutcome must be 'home_win', 'away_win', or 'draw'" })
  }),
  confidenceScore: ConfidenceScoreSchema,
  cssScore: z.number().optional(),
  predictionFactors: z.record(z.unknown()).optional().default({}),
  bttsPrediction: z.boolean().optional().nullable(),
  overUnderPrediction: z.number().optional().nullable(),
  predictedHomeScore: z.number().int().optional().nullable(),
  predictedAwayScore: z.number().int().optional().nullable(),
});

// Feedback-related schemas
export const FeedbackInputSchema = z.object({
  matchId: UuidSchema,
  homeScore: ScoreSchema,
  awayScore: ScoreSchema,
  halfTimeHomeScore: ScoreSchema.optional(),
  halfTimeAwayScore: ScoreSchema.optional(),
});

// Job-related schemas
export const JobTriggerSchema = z.object({
  jobId: UuidSchema,
  force: z.boolean().optional().default(false),
});

export const JobToggleSchema = z.object({
  jobId: UuidSchema,
  enabled: z.boolean(),
});

export const ModelPruneSchema = z.object({
  threshold: z.number().min(0).max(100).optional().default(45),
  min_sample_size: PositiveNumberSchema.optional().default(20),
});

export const JobLogsQuerySchema = z.object({
  jobId: UuidSchema,
  limit: z.number().int().min(1).max(100).optional().default(50),
});

// Pattern detection schemas
export const PatternDetectSchema = z.object({
  teamId: UuidSchema,
  patternTypes: z.array(z.enum(["winning_streak", "home_dominance", "high_scoring_trend", "form_surge"])).optional(),
});

export const PatternVerifySchema = z.object({
  patternId: UuidSchema,
  verified: z.boolean(),
  notes: z.string().optional(),
});

// Response schemas for standardization
export const ErrorResponseSchema = z.object({
  error: z.string(),
  details: z.unknown().optional(),
});

export const SuccessResponseSchema = z.object({
  success: z.boolean(),
  data: z.unknown().optional(),
  message: z.string().optional(),
});

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, body: unknown): { success: true; data: T } | { success: false; error: string; details: unknown } {
  const result = schema.safeParse(body);
  
  if (!result.success) {
    // Format error details to be more user-friendly
    const errorDetails = result.error.issues.map(issue => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code
    }));
    
    return {
      success: false,
      error: "Invalid input data",
      details: errorDetails
    };
  }
  
  return {
    success: true,
    data: result.data
  };
}

// CORS headers for Edge Functions
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};