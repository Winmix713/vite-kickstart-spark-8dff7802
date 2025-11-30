import logger from "@/lib/logger";
export interface ApiErrorShape {
  status?: number;
  message: string;
  retryAfter?: number;
  details?: unknown;
}
function redirectToLogin() {
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}
function showPermissionError() {
  // No-op placeholder; UI toasts can hook into this
  logger.warn("Permission denied: 403");
}
function showRateLimitWarning(retryAfter?: number) {
  logger.info("Rate limit reached", {
    retryAfter
  });
}
export const handleApiError = (error: unknown): ApiErrorShape => {
  const err = error as {
    status?: number;
    message?: string;
    [key: string]: unknown;
  };
  const status = typeof err.status === "number" ? err.status : undefined;
  if (status === 401) {
    redirectToLogin();
  }
  if (status === 403) {
    showPermissionError();
  }
  if (status === 429) {
    const retryAfter = typeof (err as Record<string, unknown>).retryAfter === "number" ? (err as Record<string, unknown>).retryAfter : undefined;
    showRateLimitWarning(retryAfter);
  }
  logger.error("API error", err, {
    status
  });
  const shape: ApiErrorShape = {
    status,
    message: err.message || "Unexpected error"
  };
  if ((err as Record<string, unknown>).retryAfter) {
    shape.retryAfter = (err as Record<string, unknown>).retryAfter as number;
  }
  shape.details = err;
  return shape;
};
export default handleApiError;