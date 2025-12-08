type LogLevel = "debug" | "info" | "warn" | "error" | "critical";

interface StructuredLog {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: string;
  service?: string;
}

const isDev = import.meta.env.MODE === "development";

function emit(level: LogLevel, message: string, data?: Record<string, unknown>, service?: string) {
  const payload: StructuredLog = {
    level,
    message,
    data,
    service,
    timestamp: new Date().toISOString(),
  };

  // eslint-disable-next-line no-console
  const c = console;
  if (level === "debug" && !isDev) return;

  switch (level) {
    case "debug":
      c.debug?.("[DEBUG]", payload);
      break;
    case "info":
      c.info?.("[INFO]", payload);
      break;
    case "warn":
      c.warn?.("[WARN]", payload);
      break;
    case "error":
      c.error?.("[ERROR]", payload);
      break;
    case "critical":
      c.error?.("[CRITICAL]", payload);
      break;
    default:
      c.log?.(payload);
  }
}

export const logger = {
  debug: (message: string, data?: Record<string, unknown>, service?: string) => emit("debug", message, data, service),
  info: (message: string, data?: Record<string, unknown>, service?: string) => emit("info", message, data, service),
  warn: (message: string, data?: Record<string, unknown>, service?: string) => emit("warn", message, data, service),
  error: (message: string, error: unknown, context?: Record<string, unknown>, service?: string) => {
    const data: Record<string, unknown> = { error, ...context };
    emit("error", message, data, service);
  },
  critical: (message: string, error: unknown, context?: Record<string, unknown>, service?: string) => {
    const data: Record<string, unknown> = { error, ...context };
    emit("critical", message, data, service);
  },
};

export default logger;
