import logger from "@/lib/logger";

export interface WebVitalMetric {
  name: string;
  value: number;
  id?: string;
  delta?: number;
}

export const initPerformanceMonitoring = () => {
  try {
    if (typeof window === "undefined" || !("performance" in window)) return;

    // Basic TTFB
    const [nav] = performance.getEntriesByType("navigation") as PerformanceNavigationTiming[];
    if (nav) {
      logger.debug("TTFB", { value: nav.responseStart, name: "TTFB" });
      logger.debug("FCP", { value: nav.domContentLoadedEventEnd - nav.startTime, name: "FCP" });
    }

    // Observe long tasks
    if ("PerformanceObserver" in window) {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if ((entry as PerformanceEntry).entryType === "longtask") {
            logger.warn("Long task detected", { duration: entry.duration });
          }
        }
      });
      try {
        observer.observe({ entryTypes: ["longtask"] as unknown as string[] });
      } catch {
        // Some browsers may not support this - ignore
      }
    }
  } catch (e) {
    logger.warn("Performance monitoring init failed", { error: e as Error });
  }
};
