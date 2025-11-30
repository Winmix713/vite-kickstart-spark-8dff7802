import { env } from '@/config/env';
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
interface StructuredLog {
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: string;
  service?: string;
}
const isDev = env.isDev;
function emit(level: LogLevel, message: string, data?: Record<string, unknown>, service?: string) {
  const c = console;

  // Skip debug logs in production
  if (level === 'debug' && !isDev) return;

  // Create a clean, readable log format
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0]; // HH:MM:SS format
  const servicePrefix = service ? `[${service}]` : '';
  const prefix = `${timestamp} ${servicePrefix}`.trim();
  switch (level) {
    case 'debug':
      if (isDev) {
        c.debug(`🔍 ${prefix} ${message}`, data || '');
      }
      break;
    case 'info':
      c.info(`ℹ️ ${prefix} ${message}`, data || '');
      break;
    case 'warn':
      c.warn(`⚠️ ${prefix} ${message}`, data || '');
      break;
    case 'error':
      c.error(`❌ ${prefix} ${message}`, data || '');
      break;
    case 'critical':
      c.error(`🚨 ${prefix} ${message}`, data || '');
      break;
    default:
      c.log(message, data || '');
  }
}
export const logger = {
  debug: (message: string, data?: Record<string, unknown>, service?: string) => emit('debug', message, data, service),
  info: (message: string, data?: Record<string, unknown>, service?: string) => emit('info', message, data, service),
  warn: (message: string, data?: Record<string, unknown>, service?: string) => emit('warn', message, data, service),
  error: (message: string, error: unknown, context?: Record<string, unknown>, service?: string) => {
    const data: Record<string, unknown> = {
      error: error instanceof Error ? error.message : String(error),
      ...context
    };
    emit('error', message, data, service);
  },
  critical: (message: string, error: unknown, context?: Record<string, unknown>, service?: string) => {
    const data: Record<string, unknown> = {
      error: error instanceof Error ? error.message : String(error),
      ...context
    };
    emit('critical', message, data, service);
  }
};
export default logger;