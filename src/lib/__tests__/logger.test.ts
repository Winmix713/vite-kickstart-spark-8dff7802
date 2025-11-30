import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from '../logger';
describe('logger', () => {
  let consoleSpy: {
    debug: ReturnType<typeof vi.spyOn>;
    info: ReturnType<typeof vi.spyOn>;
    warn: ReturnType<typeof vi.spyOn>;
    error: ReturnType<typeof vi.spyOn>;
    log: ReturnType<typeof vi.spyOn>;
  };
  beforeEach(() => {
    consoleSpy = {
      debug: vi.spyOn(console, 'debug').mockImplementation(() => {}),
      info: vi.spyOn(console, 'info').mockImplementation(() => {}),
      warn: vi.spyOn(console, 'warn').mockImplementation(() => {}),
      error: vi.spyOn(console, 'error').mockImplementation(() => {}),
      log: vi.spyOn(console, 'log').mockImplementation(() => {})
    };
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  describe('debug', () => {
    it('should not log debug messages in test mode', () => {
      logger.debug('Test debug message');
      // In test/production mode, debug messages are not logged
      expect(consoleSpy.debug).not.toHaveBeenCalled();
    });
  });
  describe('info', () => {
    it('should log info messages', () => {
      logger.info('Test info message');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', expect.objectContaining({
        level: 'info',
        message: 'Test info message',
        timestamp: expect.any(String)
      }));
    });
    it('should include data and service', () => {
      const data = {
        count: 42
      };
      logger.info('Info with context', data, 'DataService');
      expect(consoleSpy.info).toHaveBeenCalledWith('[INFO]', expect.objectContaining({
        level: 'info',
        message: 'Info with context',
        data,
        service: 'DataService',
        timestamp: expect.any(String)
      }));
    });
  });
  describe('warn', () => {
    it('should log warning messages', () => {
      logger.warn('Test warning message');
      expect(consoleSpy.warn).toHaveBeenCalledWith('[WARN]', expect.objectContaining({
        level: 'warn',
        message: 'Test warning message',
        timestamp: expect.any(String)
      }));
    });
  });
  describe('error', () => {
    it('should log error messages with error object', () => {
      const error = new Error('Test error');
      logger.error('Test error message', error);
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', expect.objectContaining({
        level: 'error',
        message: 'Test error message',
        data: expect.objectContaining({
          error
        }),
        timestamp: expect.any(String)
      }));
    });
    it('should include context information', () => {
      const error = new Error('Operation failed');
      const context = {
        userId: '123',
        operation: 'fetchData'
      };
      logger.error('Failed to fetch data', error, context, 'APIService');
      expect(consoleSpy.error).toHaveBeenCalledWith('[ERROR]', expect.objectContaining({
        level: 'error',
        message: 'Failed to fetch data',
        data: expect.objectContaining({
          error,
          ...context
        }),
        service: 'APIService',
        timestamp: expect.any(String)
      }));
    });
  });
  describe('critical', () => {
    it('should log critical errors', () => {
      const error = new Error('Critical failure');
      logger.critical('Critical system error', error);
      expect(consoleSpy.error).toHaveBeenCalledWith('[CRITICAL]', expect.objectContaining({
        level: 'critical',
        message: 'Critical system error',
        data: expect.objectContaining({
          error
        }),
        timestamp: expect.any(String)
      }));
    });
    it('should include context and service for critical errors', () => {
      const error = new Error('Database connection lost');
      const context = {
        database: 'primary',
        retries: 3
      };
      logger.critical('Database failure', error, context, 'DatabaseService');
      expect(consoleSpy.error).toHaveBeenCalledWith('[CRITICAL]', expect.objectContaining({
        level: 'critical',
        message: 'Database failure',
        data: expect.objectContaining({
          error,
          ...context
        }),
        service: 'DatabaseService',
        timestamp: expect.any(String)
      }));
    });
  });
  describe('timestamp', () => {
    it('should generate valid ISO timestamp', () => {
      logger.info('Timestamp test');
      const call = consoleSpy.info.mock.calls[0];
      const payload = call[1] as {
        timestamp: string;
      };
      expect(payload.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
  });
});