import { Request, Response, NextFunction } from 'express';
import { createContextLogger } from '../config/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * Middleware for logging HTTP requests with structured JSON format
 * Captures request/response details, timing, and errors
 */

export interface RequestWithContext extends Request {
  traceId?: string;
  startTime?: number;
  userId?: string;
}

/**
 * Request logging middleware
 * Logs all incoming requests with timing and response information
 */
export function requestLoggerMiddleware(
  req: RequestWithContext,
  res: Response,
  next: NextFunction
): void {
  // Generate unique trace ID for request tracking
  req.traceId = uuidv4();
  req.startTime = Date.now();

  // Create context logger with trace ID
  const contextLogger = createContextLogger({
    traceId: req.traceId,
    userId: req.userId,
  });

  // Log incoming request
  contextLogger.info('Incoming request', {
    method: req.method,
    path: req.path,
    query: req.query,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });

  // Capture response
  const originalSend = res.send;
  res.send = function (data: any) {
    const duration = Date.now() - (req.startTime || 0);

    // Log response
    contextLogger.info('Outgoing response', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      durationMs: duration,
      contentLength: res.get('content-length'),
    });

    // Call original send
    return originalSend.call(this, data);
  };

  next();
}

/**
 * Error logging middleware
 * Logs errors with full context for debugging
 */
export function errorLoggerMiddleware(
  err: Error,
  req: RequestWithContext,
  res: Response,
  next: NextFunction
): void {
  const duration = req.startTime ? Date.now() - req.startTime : 0;
  const contextLogger = createContextLogger({
    traceId: req.traceId,
    userId: req.userId,
  });

  contextLogger.error('Request error', {
    method: req.method,
    path: req.path,
    statusCode: res.statusCode,
    durationMs: duration,
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name,
    },
    ipAddress: req.ip,
  });

  next(err);
}

/**
 * Performance monitoring middleware
 * Logs slow requests that exceed threshold
 */
export function performanceMonitoringMiddleware(
  thresholdMs: number = 1000
) {
  return (req: RequestWithContext, res: Response, next: NextFunction): void => {
    const originalSend = res.send;
    res.send = function (data: any) {
      const duration = Date.now() - (req.startTime || 0);

      if (duration > thresholdMs) {
        const contextLogger = createContextLogger({
          traceId: req.traceId,
          userId: req.userId,
        });

        contextLogger.warn('Slow request detected', {
          method: req.method,
          path: req.path,
          durationMs: duration,
          threshold: thresholdMs,
          statusCode: res.statusCode,
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
}
