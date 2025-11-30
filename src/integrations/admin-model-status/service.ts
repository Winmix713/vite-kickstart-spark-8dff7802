import { supabase } from "@/integrations/supabase/client";
import logger from "@/lib/logger";
import type { SystemStatusResponse, AnalyticsResponse, TrainingRequest, TrainingResponse, PromoteModelRequest, PromoteModelResponse } from "@/types/admin-model-status";
class AdminModelStatusError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminModelStatusError";
  }
}
export async function getSystemStatus(): Promise<SystemStatusResponse> {
  try {
    const {
      data,
      error
    } = await supabase.functions.invoke("admin-model-system-status", {
      method: "GET"
    });
    if (error) throw new AdminModelStatusError(error.message);
    return data as SystemStatusResponse;
  } catch (error) {
    logger.error("Error fetching system status", error, {}, "AdminModelStatus");
    throw error;
  }
}
export async function getAnalytics(windowDays?: number): Promise<AnalyticsResponse> {
  try {
    const {
      data,
      error
    } = await supabase.functions.invoke("admin-model-analytics", {
      method: "POST",
      body: windowDays ? {
        window_days: windowDays
      } : {}
    });
    if (error) throw new AdminModelStatusError(error.message);
    return data as AnalyticsResponse;
  } catch (error) {
    logger.error("Error fetching analytics", error, {
      windowDays
    }, "AdminModelStatus");
    throw error;
  }
}
export async function promoteModel(request: PromoteModelRequest): Promise<PromoteModelResponse> {
  try {
    const {
      data,
      error
    } = await supabase.functions.invoke("admin-model-promote", {
      method: "POST",
      body: request
    });
    if (error) throw new AdminModelStatusError(error.message);
    return data as PromoteModelResponse;
  } catch (error) {
    logger.error("Error promoting model", error, {
      request
    }, "AdminModelStatus");
    throw error;
  }
}
export async function triggerTraining(request: TrainingRequest): Promise<TrainingResponse> {
  try {
    const {
      data,
      error
    } = await supabase.functions.invoke("admin-model-trigger-training", {
      method: "POST",
      body: request
    });
    if (error) throw new AdminModelStatusError(error.message);
    return data as TrainingResponse;
  } catch (error) {
    logger.error("Error triggering training", error, {
      request
    }, "AdminModelStatus");
    throw error;
  }
}

// Team CRUD operations for Data Configuration
export async function getTeams() {
  const {
    data,
    error
  } = await supabase.from("teams").select("*").order("name", {
    ascending: true
  });
  if (error) throw new AdminModelStatusError(error.message);
  return data;
}
export async function updateTeam(id: string, updates: {
  form_rating?: number;
  strength_index?: number;
}) {
  const {
    data,
    error
  } = await supabase.from("teams").update(updates).eq("id", id).select().single();
  if (error) throw new AdminModelStatusError(error.message);
  return data;
}