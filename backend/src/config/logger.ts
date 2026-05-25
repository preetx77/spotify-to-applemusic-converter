import winston from 'winston';
import path from 'path';

/**
 * Logger configuration for centralized logging with structured JSON format
 * Supports multiple transports: console (dev), file (all levels), and error file
 */

const logDir = path.join(process.cwd(), 'logs');

// Define log format with structured JSON
const jsonFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Console format for development (more readable)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
  })
);

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: jsonFormat,
  defaultMeta: {
    service: 'spotify-to-applemusic-converter',
    environment: process.env.NODE_ENV || 'development',
  },
  transports: [
    // Console transport (always enabled)
    new winston.transports.Console({
      format: consoleFormat,
      level: process.env.LOG_LEVEL || 'info',
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: jsonFormat,
    }),
    // File transport for error logs only
    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 10,
      format: jsonFormat,
    }),
  ],
});

// Add additional context to logs
export interface LogContext {
  userId?: string;
  conversionJobId?: string;
  traceId?: string;
  ipAddress?: string;
  userAgent?: string;
  [key: string]: any;
}

/**
 * Create a child logger with additional context
 * @param context - Additional context to include in all logs from this logger
 * @returns Child logger instance with context
 */
export function createContextLogger(context: LogContext): winston.Logger {
  return logger.child(context);
}

export default logger;
