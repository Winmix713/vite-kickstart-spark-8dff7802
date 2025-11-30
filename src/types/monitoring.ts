export type HealthStatus = "healthy" | "degraded" | "down" | "unknown";
export interface SystemHealthSnapshot {
  id: string;
  component_name: string;
  component_type: string;
  status: HealthStatus;
  response_time_ms: number | null;
  error_rate: number | null;
  cpu_usage: number | null;
  memory_usage: number | null;
  checked_at: string;
}
export interface HealthSummaryResponse {
  components: SystemHealthSnapshot[];
  status_counts: {
    healthy: number;
    degraded: number;
    down: number;
    unknown: number;
  };
  updated_at: string;
}
export interface PerformanceMetricRow {
  id: string;
  metric_name: string; // latency_p50 | latency_p95 | latency_p99 | throughput | error_rate
  metric_type: string; // latency | throughput | error_rate | accuracy
  metric_category: string; // prediction | pattern_detection | api_call | general
  value: number;
  unit: string; // ms | rps | percent | score
  component: string;
  timestamp: string;
}
export interface MetricsResponse {
  metrics: PerformanceMetricRow[];
}
export interface ComputationGraphNodeData {
  label: string;
  status: HealthStatus;
  nodeType: string;
  executionTimeMs: number | null;
  lastRun: string | null;
}
export interface ComputationGraphResponse {
  nodes: Array<{
    id: string;
    data: ComputationGraphNodeData;
    position: {
      x: number;
      y: number;
    };
  }>;
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}
export interface AlertItem {
  id: string;
  severity: "critical" | "warning" | "info";
  message: string;
  component?: string;
  timestamp: string;
}
export interface AlertsResponse {
  alerts: AlertItem[];
}