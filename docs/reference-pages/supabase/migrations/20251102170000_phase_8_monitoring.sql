-- Phase 8: Monitoring & Visualization

-- 1) System health snapshots
CREATE TABLE IF NOT EXISTS public.system_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  component_name TEXT NOT NULL,
  component_type TEXT NOT NULL, -- api, edge_function, database, frontend, service
  status TEXT NOT NULL,         -- healthy, degraded, down
  response_time_ms INTEGER,
  error_rate DOUBLE PRECISION,
  cpu_usage DOUBLE PRECISION,
  memory_usage DOUBLE PRECISION,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.system_health IS 'Component health snapshots for monitoring dashboard.';
COMMENT ON COLUMN public.system_health.component_type IS 'api | edge_function | database | frontend | service | scheduler';
COMMENT ON COLUMN public.system_health.status IS 'healthy | degraded | down';

CREATE INDEX IF NOT EXISTS idx_system_health_component_name ON public.system_health(component_name);
CREATE INDEX IF NOT EXISTS idx_system_health_checked_at ON public.system_health(checked_at DESC);

-- 2) Performance metrics time-series
CREATE TABLE IF NOT EXISTS public.performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,        -- e.g. latency_p50, latency_p95, latency_p99, throughput, error_rate
  metric_type TEXT NOT NULL,        -- latency | throughput | error_rate | accuracy
  metric_category TEXT NOT NULL,    -- prediction | pattern_detection | api_call | general
  value DOUBLE PRECISION NOT NULL,
  unit TEXT NOT NULL,               -- ms | rps | percent | score
  component TEXT NOT NULL,          -- e.g. analyze-match function, API, DB
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.performance_metrics IS 'Generic time-series metrics storage.';
CREATE INDEX IF NOT EXISTS idx_performance_metrics_component_timestamp ON public.performance_metrics(component, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_type ON public.performance_metrics(metric_type);

-- 3) Computation graph definition for React Flow
CREATE TABLE IF NOT EXISTS public.computation_graph (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  node_id TEXT NOT NULL UNIQUE,
  node_name TEXT NOT NULL,
  node_type TEXT NOT NULL,          -- input | transformation | aggregation | output
  dependencies TEXT[] DEFAULT ARRAY[]::TEXT[],
  execution_time_ms INTEGER,
  position_x DOUBLE PRECISION DEFAULT 0,
  position_y DOUBLE PRECISION DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'healthy',
  last_run TIMESTAMPTZ
);

COMMENT ON TABLE public.computation_graph IS 'Graph of data processing pipeline for visualization.';
CREATE INDEX IF NOT EXISTS idx_computation_graph_status ON public.computation_graph(status);

-- Seed a minimal dataset to make the dashboard useful out-of-the-box
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.system_health WHERE checked_at > NOW() - INTERVAL '1 hour'
  ) THEN
    INSERT INTO public.system_health (component_name, component_type, status, response_time_ms, error_rate, cpu_usage, memory_usage)
    VALUES
      ('Public API', 'api', 'healthy', 120, 0.01, 22.5, 35.0),
      ('analyze-match', 'edge_function', 'degraded', 480, 0.06, 65.0, 52.0),
      ('get-predictions', 'edge_function', 'healthy', 160, 0.02, 30.0, 40.0),
      ('Postgres DB', 'database', 'healthy', 90, 0.005, 35.0, 60.0),
      ('Frontend', 'frontend', 'healthy', 45, 0.0, NULL, NULL);
  END IF;
END $$;

DO $$
DECLARE
  base_time TIMESTAMPTZ := NOW() - INTERVAL '2 hours';
  i INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.performance_metrics WHERE timestamp > NOW() - INTERVAL '1 hour'
  ) THEN
    FOR i IN 0..12 LOOP
      INSERT INTO public.performance_metrics (metric_name, metric_type, metric_category, value, unit, component, timestamp)
      VALUES
        ('latency_p50', 'latency', 'api_call', 100 + (i * 5), 'ms', 'Public API', base_time + make_interval(mins => i * 10)),
        ('latency_p95', 'latency', 'api_call', 220 + (i * 7), 'ms', 'Public API', base_time + make_interval(mins => i * 10)),
        ('latency_p99', 'latency', 'api_call', 380 + (i * 9), 'ms', 'Public API', base_time + make_interval(mins => i * 10)),
        ('throughput',  'throughput', 'api_call', 30 + (i % 5), 'rps', 'Public API', base_time + make_interval(mins => i * 10)),
        ('error_rate',  'error_rate', 'api_call', CASE WHEN i % 6 = 0 THEN 0.08 ELSE 0.02 END, 'percent', 'Public API', base_time + make_interval(mins => i * 10)),

        ('latency_p50', 'latency', 'prediction', 320 + (i * 8), 'ms', 'analyze-match', base_time + make_interval(mins => i * 10)),
        ('latency_p95', 'latency', 'prediction', 520 + (i * 10), 'ms', 'analyze-match', base_time + make_interval(mins => i * 10)),
        ('latency_p99', 'latency', 'prediction', 800 + (i * 12), 'ms', 'analyze-match', base_time + make_interval(mins => i * 10)),
        ('error_rate',  'error_rate', 'prediction', CASE WHEN i % 5 = 0 THEN 0.12 ELSE 0.04 END, 'percent', 'analyze-match', base_time + make_interval(mins => i * 10));
    END LOOP;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.computation_graph) THEN
    INSERT INTO public.computation_graph (node_id, node_name, node_type, dependencies, execution_time_ms, position_x, position_y, status, last_run) VALUES
      ('data_source', 'Data Source', 'input', ARRAY[]::TEXT[], 40, 50, 80, 'healthy', NOW() - INTERVAL '10 min'),
      ('pattern_detection', 'Pattern Detection', 'transformation', ARRAY['data_source'], 180, 300, 120, 'healthy', NOW() - INTERVAL '8 min'),
      ('prediction_engine', 'Prediction Engine', 'aggregation', ARRAY['pattern_detection'], 450, 600, 160, 'degraded', NOW() - INTERVAL '7 min'),
      ('feedback_loop', 'Feedback Loop', 'transformation', ARRAY['prediction_engine'], 120, 900, 200, 'healthy', NOW() - INTERVAL '5 min'),
      ('api_response', 'API Response', 'output', ARRAY['prediction_engine'], 60, 600, 380, 'healthy', NOW() - INTERVAL '2 min');
  END IF;
END $$;
