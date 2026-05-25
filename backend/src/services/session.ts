import { RedisClientType } from 'redis';
import { v4 as uuidv4 } from 'uuid';
import logger from '../config/logger';

/**
 * Session data structure stored in Redis
 */
export interface SessionData {
  userId: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyTokenExpiresAt?: number;
  appleMusicToken?: string;
  appleMusicTokenExpiresAt?: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: number;
  lastActivityAt: number;
}

/**
 * Session store adapter for Express using Redis
 * Implements session creation, validation, and management
 */
export class RedisSessionStore {
  private redisClient: RedisClientType;
  private sessionTTL: number; // 24 hours in seconds
  private inactivityTimeout: number; // 30 minutes in seconds
  private sessionKeyPrefix = 'session:';

  constructor(redisClient: RedisClientType, sessionTTL = 86400, inactivityTimeout = 1800) {
    this.redisClient = redisClient;
    this.sessionTTL = sessionTTL;
    this.inactivityTimeout = inactivityTimeout;
  }

  /**
   * Create a new session
   * @param userId - User ID
   * @param spotifyAccessToken - Spotify access token
   * @param spotifyRefreshToken - Spotify refresh token
   * @param spotifyTokenExpiresAt - Spotify token expiration time
   * @param ipAddress - Client IP address
   * @param userAgent - Client user agent
   * @returns Session ID and session data
   */
  async createSession(
    userId: string,
    spotifyAccessToken?: string,
    spotifyRefreshToken?: string,
    spotifyTokenExpiresAt?: number,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ sessionId: string; sessionData: SessionData }> {
    const sessionId = uuidv4();
    const now = Date.now();

    const sessionData: SessionData = {
      userId,
      spotifyAccessToken,
      spotifyRefreshToken,
      spotifyTokenExpiresAt,
      ipAddress,
      userAgent,
      createdAt: now,
      lastActivityAt: now,
    };

    const sessionKey = this.getSessionKey(sessionId);
    await this.redisClient.setEx(sessionKey, this.sessionTTL, JSON.stringify(sessionData));

    logger.info('Session created', {
      sessionId,
      userId,
      expiresIn: this.sessionTTL,
    });

    return { sessionId, sessionData };
  }

  /**
   * Get session data by session ID
   * @param sessionId - Session ID
   * @returns Session data or null if not found or expired
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = this.getSessionKey(sessionId);
    const data = await this.redisClient.get(sessionKey);

    if (!data) {
      return null;
    }

    try {
      const sessionData: SessionData = JSON.parse(data);
      return sessionData;
    } catch (error) {
      logger.error('Failed to parse session data', { sessionId, error });
      return null;
    }
  }

  /**
   * Update session data
   * @param sessionId - Session ID
   * @param updates - Partial session data to update
   * @returns Updated session data or null if session not found
   */
  async updateSession(sessionId: string, updates: Partial<SessionData>): Promise<SessionData | null> {
    const sessionKey = this.getSessionKey(sessionId);
    const data = await this.redisClient.get(sessionKey);

    if (!data) {
      return null;
    }

    try {
      const sessionData: SessionData = JSON.parse(data);
      const updatedData: SessionData = {
        ...sessionData,
        ...updates,
        lastActivityAt: Date.now(),
      };

      await this.redisClient.setEx(sessionKey, this.sessionTTL, JSON.stringify(updatedData));

      logger.debug('Session updated', { sessionId });

      return updatedData;
    } catch (error) {
      logger.error('Failed to update session', { sessionId, error });
      return null;
    }
  }

  /**
   * Refresh session TTL (called on each request)
   * @param sessionId - Session ID
   * @returns Updated session data or null if session not found
   */
  async refreshSession(sessionId: string): Promise<SessionData | null> {
    const sessionKey = this.getSessionKey(sessionId);
    const data = await this.redisClient.get(sessionKey);

    if (!data) {
      return null;
    }

    try {
      const sessionData: SessionData = JSON.parse(data);
      
      // Check for inactivity timeout
      const timeSinceLastActivity = Date.now() - sessionData.lastActivityAt;
      if (timeSinceLastActivity > this.inactivityTimeout * 1000) {
        logger.info('Session expired due to inactivity', { sessionId });
        await this.deleteSession(sessionId);
        return null;
      }

      // Refresh TTL and update last activity
      const updatedData: SessionData = {
        ...sessionData,
        lastActivityAt: Date.now(),
      };

      await this.redisClient.setEx(sessionKey, this.sessionTTL, JSON.stringify(updatedData));

      return updatedData;
    } catch (error) {
      logger.error('Failed to refresh session', { sessionId, error });
      return null;
    }
  }

  /**
   * Delete session
   * @param sessionId - Session ID
   */
  async deleteSession(sessionId: string): Promise<void> {
    const sessionKey = this.getSessionKey(sessionId);
    await this.redisClient.del(sessionKey);
    logger.info('Session deleted', { sessionId });
  }

  /**
   * Validate session exists and is not expired
   * @param sessionId - Session ID
   * @returns true if session is valid, false otherwise
   */
  async validateSession(sessionId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    return session !== null;
  }

  /**
   * Get Redis key for session
   * @param sessionId - Session ID
   * @returns Redis key
   */
  private getSessionKey(sessionId: string): string {
    return `${this.sessionKeyPrefix}${sessionId}`;
  }
}

export default RedisSessionStore;
