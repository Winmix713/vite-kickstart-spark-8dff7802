export type MetricsPoint = {
  time: string; // ISO string
  p50?: number;
  p95?: number;
  p99?: number;
};