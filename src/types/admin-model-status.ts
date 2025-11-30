export interface SystemStatusResponse {
  models: ModelRegistryItem[];
  activeModel: ModelRegistryItem | null;
  experiments: ModelExperimentItem[];
  recentPredictions: PredictionSummary[];
  config: ModelConfig;
}
export interface ModelRegistryItem {
  id: string;
  model_name: string;
  model_version: string;
  model_type: "champion" | "challenger" | "retired";
  algorithm?: string | null;
  hyperparameters?: Record<string, unknown> | null;
  traffic_allocation?: number | null;
  total_predictions?: number | null;
  accuracy?: number | null;
  registered_at?: string | null;
  is_active?: boolean;
  description?: string;
}
export interface ModelExperimentItem {
  id: string;
  experiment_name: string;
  champion_model_id: string;
  challenger_model_id: string;
  started_at?: string | null;
  target_sample_size?: number | null;
  current_sample_size?: number | null;
  significance_threshold?: number | null;
  accuracy_diff?: number | null;
  p_value?: number | null;
  winner_model_id?: string | null;
  decision?: "promote" | "keep" | "continue" | null;
  completed_at?: string | null;
}
export interface PredictionSummary {
  id: string;
  confidence: number;
  created_at: string;
}
export interface ModelConfig {
  active_model_id: string | null;
  prediction_target: string;
  min_confidence_threshold: number;
}
export interface AnalyticsResponse {
  summary: {
    totalPredictions: number;
    correctPredictions: number;
    accuracy: number;
    failRate: number;
    avgConfidence: number;
  };
  timeSeriesData: TimeSeriesPoint[];
  confidenceTrend: ConfidenceTrendPoint[];
  windowDays: number;
  systemStatus: "healthy" | "warning" | "degraded";
}
export interface TimeSeriesPoint {
  date: string;
  accuracy: number;
  confidence: number;
  predictions: number;
}
export interface ConfidenceTrendPoint {
  timestamp: string;
  confidence: number;
  isCorrect: boolean;
}
export interface TrainingRequest {
  modelName?: string;
  algorithm?: string;
}
export interface TrainingResponse {
  success: boolean;
  message: string;
  jobId: string;
  modelId: string;
  estimatedTime: string;
  status: "queued" | "running" | "complete" | "failed";
}
export interface PromoteModelRequest {
  modelId: string;
}
export interface PromoteModelResponse {
  success: boolean;
  message: string;
}