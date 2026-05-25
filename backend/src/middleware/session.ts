import { Request, Response, NextFunction } from 'express';
import { RedisSessionStore } from '../services/session';
import logger from '../config/logger';

/**
 * Extend Express Request to include session data
 */
declare global {
  namespace Express {
    interface Request {
      sessionId?: string;
      userId?: string;
      session?: any;
    }
  }
}

/**
 * Session middleware for Express
 * Validates session from cookie and attaches session data to request
 */
export function createSessionMiddleware(sessionStore: RedisSessionStore) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Get session ID from cookie
      const sessionId = req.cookies?.sessionId;

      if (!sessionId) {
        // No session cookie, continue without session
        return next();
      }

      // Validate and refresh session
      const sessionData = await sessionStore.refreshSession(sessionId);

      if (!sessionData) {
        // Session expired or invalid, clear cookie
        res.clearCookie('sessionId');
        return next();
      }

      // Attach session data to request
      req.sessionId = sessionId;
      req.userId = sessionData.userId;
      req.session = sessionData;

      logger.debug('Session validated', {
        sessionId,
        userId: sessionData.userId,
      });

      next();
    } catch (error) {
      logger.error('Session middleware error', { error });
      next();
    }
  };
}

/**
 * Middleware to require authenticated session
 * Returns 401 if no valid session
 */
export function requireSession(req: Request, res: Response, next: NextFunction): void {
  if (!req.sessionId || !req.userId) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Session required',
    });
    return;
  }

  next();
}

/**
 * Middleware to require specific session data
 * @param requiredFields - Array of required session fields
 */
export function requireSessionFields(...requiredFields: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Session required',
      });
      return;
    }

    const missingFields = requiredFields.filter((field) => !req.session[field]);

    if (missingFields.length > 0) {
      res.status(401).json({
        error: 'Unauthorized',
        message: `Missing required session fields: ${missingFields.join(', ')}`,
      });
      return;
    }

    next();
  };
}

export default { createSessionMiddleware, requireSession, requireSessionFields };
