import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { ComponentHealth } from "@/integrations/health-check";
import { healthCheck } from "@/integrations/health-check";
import logger from "@/lib/logger";
export const useHealthMetrics = () => {
  const [metrics, setMetrics] = useState<ComponentHealth | null>(null);
  useEffect(() => {
    let cancelled = false;
    const interval = setInterval(async () => {
      try {
        const health = await healthCheck();
        if (!cancelled) setMetrics(health);

        // Persist snapshot for historical analysis if table exists
        // Non-fatal if it fails
        try {
          await supabase.from("system_health_metrics").insert({
            timestamp: new Date().toISOString(),
            db_response_time: health.dbResponseTime,
            api_response_time: health.avgResponseTime,
            error_rate: health.errorRate,
            active_users: health.activeUsers ?? null,
            memory_usage: Math.round((health.memoryUsage ?? 0) * 100),
            cpu_usage: Math.round((health.cpuUsage ?? 0) * 100),
            cache_hit_rate: Math.round((health.cacheHitRate ?? 0) * 100)
          });
        } catch (e) {
          logger.debug("Failed to persist health metrics (likely table missing)", {
            error: e as Error
          });
        }
      } catch (e) {
        logger.warn("Health check failed", {
          error: e as Error
        });
      }
    }, 10000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);
  return metrics;
};
export default useHealthMetrics;