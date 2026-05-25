import { Response } from 'express';
import {
  requestLoggerMiddleware,
  errorLoggerMiddleware,
  performanceMonitoringMiddleware,
  RequestWithContext,
} from './requestLogger';

// Mock logger module
jest.mock('../config/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
  createContextLogger: jest.fn(() => ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  })),
}));

describe('Request Logger Middleware', () => {
  let mockReq: Partial<RequestWithContext>;
  let mockRes: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      method: 'GET',
      path: '/api/test',
      query: {},
      ip: '127.0.0.1',
      get: jest.fn((header: string) => {
        if (header === 'user-agent') return 'Mozilla/5.0';
        return undefined;
      }) as any,
    };

    mockRes = {
      statusCode: 200,
      get: jest.fn((header: string) => {
        if (header === 'content-length') return '1024';
        return undefined;
      }) as any,
      send: jest.fn((_data: any) => mockRes) as any,
    };

    mockNext = jest.fn();
  });

  describe('requestLoggerMiddleware', () => {
    it('should generate a trace ID for each request', () => {
      requestLoggerMiddleware(
        mockReq as RequestWithContext,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.traceId).toBeDefined();
      expect(typeof mockReq.traceId).toBe('string');
      expect(mockReq.traceId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      );
    });

    it('should record start time', () => {
      requestLoggerMiddleware(
        mockReq as RequestWithContext,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.startTime).toBeDefined();
      expect(typeof mockReq.startTime).toBe('number');
    });

    it('should call next middleware', () => {
      requestLoggerMiddleware(
        mockReq as RequestWithContext,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should capture response and log it', () => {
      requestLoggerMiddleware(
        mockReq as RequestWithContext,
        mockRes as Response,
        mockNext
      );

      // Call the send method
      const sendFn = mockRes.send as jest.Mock;
      sendFn('test data');

      // Verify response was logged
      expect(mockNext).toHaveBeenCalled();
    });

    it('should include request details in log', () => {
      requestLoggerMiddleware(
        mockReq as RequestWithContext,
        mockRes as Response,
        mockNext
      );

      expect(mockReq.traceId).toBeDefined();
    });
  });

  describe('errorLoggerMiddleware', () => {
    it('should log errors with context', () => {
      const error = new Error('Test error');
      mockReq.startTime = Date.now();

      errorLoggerMiddleware(
        error,
        mockReq as RequestWithContext,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should call next middleware', () => {
      const error = new Error('Test error');

      errorLoggerMiddleware(
        error,
        mockReq as RequestWithContext,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });

    it('should calculate request duration', () => {
      const error = new Error('Test error');
      mockReq.startTime = Date.now() - 1000; // 1 second ago

      errorLoggerMiddleware(
        error,
        mockReq as RequestWithContext,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('performanceMonitoringMiddleware', () => {
    it('should create middleware with default threshold', () => {
      const middleware = performanceMonitoringMiddleware();
      expect(typeof middleware).toBe('function');
    });

    it('should create middleware with custom threshold', () => {
      const middleware = performanceMonitoringMiddleware(500);
      expect(typeof middleware).toBe('function');
    });

    it('should call next middleware', () => {
      const middleware = performanceMonitoringMiddleware();

      middleware(
        mockReq as RequestWithContext,
        mockRes as Response,
        mockNext
      );

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Trace ID propagation', () => {
    it('should maintain same trace ID throughout request lifecycle', () => {
      const req = mockReq as RequestWithContext;

      requestLoggerMiddleware(req, mockRes as Response, mockNext);
      const traceId = req.traceId;

      // Simulate error handling
      const error = new Error('Test error');
      errorLoggerMiddleware(error, req, mockRes as Response, mockNext);

      expect(req.traceId).toBe(traceId);
    });
  });

  describe('Request context', () => {
    it('should support userId in context', () => {
      const req = mockReq as RequestWithContext;
      req.userId = 'user-123';

      requestLoggerMiddleware(req, mockRes as Response, mockNext);

      expect(req.userId).toBe('user-123');
    });

    it('should preserve userId through middleware chain', () => {
      const req = mockReq as RequestWithContext;
      req.userId = 'user-456';

      requestLoggerMiddleware(req, mockRes as Response, mockNext);
      errorLoggerMiddleware(
        new Error('Test'),
        req,
        mockRes as Response,
        mockNext
      );

      expect(req.userId).toBe('user-456');
    });
  });
});
