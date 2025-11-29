interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: any
  service?: string
  requestId?: string
}

export class Logger {
  private serviceName: string

  constructor(serviceName: string = 'api') {
    this.serviceName = serviceName
  }

  debug(message: string, context?: any, service?: string): void {
    this.log('debug', message, context, service)
  }

  info(message: string, context?: any, service?: string): void {
    this.log('info', message, context, service)
  }

  warn(message: string, context?: any, service?: string): void {
    this.log('warn', message, context, service)
  }

  error(message: string, error?: any, context?: any, service?: string): void {
    const errorContext = {
      ...context,
      error: error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : undefined
    }
    this.log('error', message, errorContext, service)
  }

  private log(level: LogEntry['level'], message: string, context?: any, service?: string): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      service: service || this.serviceName,
      requestId: crypto.randomUUID()
    }

    // In production, this would send to a logging service
    // For now, we'll just log to console with structured format
    console.log(JSON.stringify(logEntry))
  }

  // Log API request
  logRequest(req: Request, startTime: number): void {
    const duration = Date.now() - startTime
    this.info('API Request', {
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent'),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
      duration
    }, 'http')
  }

  // Log API response
  logResponse(req: Request, status: number, duration: number): void {
    this.info('API Response', {
      method: req.method,
      url: req.url,
      status,
      duration
    }, 'http')
  }

  // Log API error
  logAPIError(req: Request, error: any, duration: number): void {
    this.error('API Error', error, {
      method: req.method,
      url: req.url,
      duration
    }, 'http')
  }

  // Log security events
  logSecurityEvent(event: string, details: any): void {
    this.warn(`Security Event: ${event}`, details, 'security')
  }

  // Log performance metrics
  logPerformance(metric: string, value: number, unit?: string): void {
    this.info('Performance Metric', {
      metric,
      value,
      unit,
      timestamp: new Date().toISOString()
    }, 'performance')
  }
}

export const logger = new Logger()