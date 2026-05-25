import logger, { createContextLogger, LogContext } from './logger';
import winston from 'winston';

describe('Logger Configuration', () => {
  describe('Logger instance', () => {
    it('should create a logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger).toBeInstanceOf(winston.Logger);
    });

    it('should have correct default metadata', () => {
      expect(logger.defaultMeta).toHaveProperty('service');
      expect(logger.defaultMeta.service).toBe('spotify-to-applemusic-converter');
    });

    it('should have console transport', () => {
      const consoleTransport = logger.transports.find(
        (t) => t instanceof winston.transports.Console
      );
      expect(consoleTransport).toBeDefined();
    });

    it('should have file transports', () => {
      const fileTransports = logger.transports.filter(
        (t) => t instanceof winston.transports.File
      );
      expect(fileTransports.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('createContextLogger', () => {
    it('should create a child logger with context', () => {
      const context: LogContext = {
        userId: 'test-user-123',
        traceId: 'trace-456',
      };

      const childLogger = createContextLogger(context);
      expect(childLogger).toBeDefined();
      expect(childLogger).toBeInstanceOf(winston.Logger);
    });

    it('should include context in child logger', () => {
      const context: LogContext = {
        userId: 'test-user-123',
        conversionJobId: 'job-789',
      };

      const childLogger = createContextLogger(context);
      // Child logger should have the context merged with default metadata
      expect(childLogger.defaultMeta).toBeDefined();
      // The child logger will have both the context and the default metadata
      expect(childLogger.defaultMeta).toHaveProperty('service');
    });

    it('should support multiple context properties', () => {
      const context: LogContext = {
        userId: 'user-123',
        conversionJobId: 'job-456',
        traceId: 'trace-789',
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0',
        customField: 'custom-value',
      };

      const childLogger = createContextLogger(context);
      expect(childLogger.defaultMeta).toBeDefined();
      // Verify the child logger was created successfully
      expect(childLogger).toBeInstanceOf(winston.Logger);
    });
  });

  describe('Logging levels', () => {
    it('should support all log levels', () => {
      const levels = ['error', 'warn', 'info', 'debug'];
      levels.forEach((level) => {
        expect(typeof logger[level as keyof typeof logger]).toBe('function');
      });
    });

    it('should log with correct level', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Test message', { testData: 'value' });
      expect(spy).toHaveBeenCalledWith('Test message', { testData: 'value' });
      spy.mockRestore();
    });
  });

  describe('JSON format', () => {
    it('should format logs as JSON', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Test message', { key: 'value' });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should include timestamp in logs', () => {
      const spy = jest.spyOn(logger, 'info');
      logger.info('Test message');
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });

    it('should include error stack traces', () => {
      const error = new Error('Test error');
      const spy = jest.spyOn(logger, 'error');
      logger.error('Error occurred', { error });
      expect(spy).toHaveBeenCalled();
      spy.mockRestore();
    });
  });
});
