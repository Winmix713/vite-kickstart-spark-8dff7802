import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";
export interface BlockedPrediction {
  id: string;
  match_id: string;
  predicted_outcome: string;
  confidence_score: number;
  downgraded_from_confidence: number | null;
  prediction_status: string;
  overconfidence_flag: boolean;
  blocked_reason: string | null;
  alternate_outcome: string | null;
  blocked_at: string;
  reviewer_email: string | null;
  home_team_name: string;
  away_team_name: string;
}
export interface PredictionReviewResponse {
  success: boolean;
  data?: BlockedPrediction[];
  pagination?: {
    offset: number;
    limit: number;
    total: number;
  };
  message?: string;
  error?: string;
}
export interface ReviewActionRequest {
  predictionId: string;
  action: "accepted" | "rejected";
  notes?: string;
}
export interface ReviewActionResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    predictionId: string;
    action: string;
    newStatus: string;
  };
}
export async function getBlockedPredictions(limit: number = 50, offset: number = 0): Promise<PredictionReviewResponse> {
  try {
    const query = new URLSearchParams({
      limit: Math.min(limit, 100).toString(),
      offset: offset.toString()
    });
    const {
      data,
      error
    } = await supabase.functions.invoke(`admin-prediction-review?${query.toString()}`, {
      method: "GET"
    });
    if (error) {
      throw new Error(error.message || "Failed to fetch blocked predictions");
    }
    return data as PredictionReviewResponse;
  } catch (error) {
    logger.error("Error fetching blocked predictions", error, {
      limit,
      offset
    }, "PredictionReview");
    throw error;
  }
}
export async function submitPredictionReview(request: ReviewActionRequest): Promise<ReviewActionResponse> {
  try {
    const {
      data,
      error
    } = await supabase.functions.invoke("admin-prediction-review", {
      method: "POST",
      body: request
    });
    if (error) {
      throw new Error(error.message || "Failed to submit review");
    }
    return data as ReviewActionResponse;
  } catch (error) {
    logger.error("Error submitting prediction review", error, {
      request
    }, "PredictionReview");
    throw error;
  }
}