import logger from '@/lib/logger';
import { env } from '@/config/env';
export interface WebVitalMetric {
  name: string;
  value: number;
  id?: string;
  delta?: number;
}
export const initPerformanceMonitoring = () => {
  // Only enable performance monitoring in development mode
  if (!env.isDev) return;
  try {
    if (typeof window === 'undefined' || !('performance' in window)) return;

    // Basic TTFB
    const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    if (nav) {
      logger.debug('TTFB', {
        value: nav.responseStart,
        name: 'TTFB'
      });
      logger.debug('FCP', {
        value: nav.domContentLoadedEventEnd - nav.startTime,
        name: 'FCP'
      });
    }

    // Observe long tasks - only log if they're significantly long (>100ms)
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          if ((entry as PerformanceEntry).entryType === 'longtask') {
            // Only warn about tasks longer than 100ms
            if (entry.duration > 100) {
              logger.debug('Long task detected', {
                duration: Math.round(entry.duration) + 'ms'
              });
            }
          }
        }
      });
      try {
        observer.observe({
          entryTypes: ['longtask'] as unknown as string[]
        });
      } catch {
        // Some browsers may not support this - ignore
      }
    }
  } catch (e) {
    // Silently fail - performance monitoring is not critical
    logger.debug('Performance monitoring init failed', {
      error: (e as Error).message
    });
  }
};