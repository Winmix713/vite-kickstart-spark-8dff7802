type SentryGlobal = {
  init?: (options: Record<string, unknown>) => void;
  captureException?: (error: unknown, context?: Record<string, unknown>) => void;
  defaultIntegrations?: unknown;
};
declare global {
  interface Window {
    Sentry?: SentryGlobal;
  }
}
export const isSentryEnabled = (): boolean => {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  return Boolean(dsn && dsn.trim().length > 0);
};
export function initSentry(): void {
  try {
    const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
    if (!dsn) return;

    // Avoid injecting multiple times
    if (window.Sentry) return;
    const script = document.createElement("script");
    script.src = "https://browser.sentry-cdn.com/7.114.0/bundle.min.js";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => {
      try {
        const environment = import.meta.env.VITE_SENTRY_ENV as string | undefined || import.meta.env.MODE;
        const tracesSampleRate = import.meta.env.DEV ? 1.0 : 0.2;
        const replaysOnErrorSampleRate = 0.1;
        const replaysSessionSampleRate = 0.05;
        window.Sentry?.init?.({
          dsn,
          environment,
          tracesSampleRate,
          integrations: window.Sentry?.defaultIntegrations,
          replaysOnErrorSampleRate,
          replaysSessionSampleRate
        });
      } catch {
        // ignore
      }
    };
    document.head.appendChild(script);
  } catch {
    // ignore
  }
}
export function captureExceptionSafe(error: unknown, context?: Record<string, unknown>): void {
  try {
    window.Sentry?.captureException?.(error, {
      extra: context
    });
  } catch {
    // ignore
  }
}