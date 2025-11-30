export type ModelType = "champion" | "challenger" | "retired";
export interface ModelRegistry {
  id: string;
  model_name: string;
  model_version: string;
  model_type: ModelType;
  algorithm?: string | null;
  hyperparameters?: Record<string, unknown> | null;
  traffic_allocation?: number | null;
  total_predictions?: number | null;
  accuracy?: number | null;
  registered_at?: string | null;
  is_active?: boolean;
  description?: string;
}
export interface ModelExperiment {
  id: string;
  experiment_name: string;
  champion_model_id: string;
  challenger_model_id: string;
  started_at?: string | null;
  target_sample_size?: number | null;
  current_sample_size?: number | null;
  significance_threshold?: number | null; // default 0.05
  accuracy_diff?: number | null;
  p_value?: number | null;
  winner_model_id?: string | null;
  decision?: "promote" | "keep" | "continue" | null;
  completed_at?: string | null;
}
export interface ModelSelectionResponse {
  selectedModelId: string;
  strategy: "exploit" | "explore";
  explorationRate: number;
}
export interface ShadowRunRequest {
  matchId: string;
  modelId: string;
}
export interface ShadowRunResult {
  createdPredictionId?: string;
}