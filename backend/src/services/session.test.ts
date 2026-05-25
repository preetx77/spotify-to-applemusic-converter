import { RedisSessionStore } from './session';

/**
 * Mock Redis client for testing
 */
class MockRedisClient {
  private store: Map<string, string> = new Map();
  private ttls: Map<string, number> = new Map();

  async setEx(key: string, seconds: number, value: string): Promise<any> {
    this.store.set(key, value);
    this.ttls.set(key, Date.now() + seconds * 1000);
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    const ttl = this.ttls.get(key);
    if (ttl && ttl < Date.now()) {
      this.store.delete(key);
      this.ttls.delete(key);
      return null;
    }
    return this.store.get(key) || null;
  }

  async del(key: string | string[]): Promise<number> {
    if (Array.isArray(key)) {
      let count = 0;
      for (const k of key) {
        if (this.store.has(k)) {
          this.store.delete(k);
          this.ttls.delete(k);
          count++;
        }
      }
      return count;
    }
    if (this.store.has(key)) {
      this.store.delete(key);
      this.ttls.delete(key);
      return 1;
    }
    return 0;
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return Array.from(this.store.keys()).filter((key) => regex.test(key));
  }

  clear(): void {
    this.store.clear();
    this.ttls.clear();
  }
}

describe('RedisSessionStore', () => {
  let sessionStore: RedisSessionStore;
  let mockRedis: MockRedisClient;

  beforeEach(() => {
    mockRedis = new MockRedisClient();
    sessionStore = new RedisSessionStore(mockRedis as any, 3600, 1800);
  });

  describe('createSession', () => {
    it('should create a new session with valid data', async () => {
      const userId = 'user-123';
      const spotifyAccessToken = 'spotify-token-123';
      const spotifyRefreshToken = 'spotify-refresh-123';
      const spotifyTokenExpiresAt = Date.now() + 3600000;

      const { sessionId, sessionData } = await sessionStore.createSession(
        userId,
        spotifyAccessToken,
        spotifyRefreshToken,
        spotifyTokenExpiresAt,
        '192.168.1.1',
        'Mozilla/5.0'
      );

      expect(sessionId).toBeDefined();
      expect(sessionData.userId).toBe(userId);
      expect(sessionData.spotifyAccessToken).toBe(spotifyAccessToken);
      expect(sessionData.spotifyRefreshToken).toBe(spotifyRefreshToken);
      expect(sessionData.spotifyTokenExpiresAt).toBe(spotifyTokenExpiresAt);
      expect(sessionData.ipAddress).toBe('192.168.1.1');
      expect(sessionData.userAgent).toBe('Mozilla/5.0');
      expect(sessionData.createdAt).toBeDefined();
      expect(sessionData.lastActivityAt).toBeDefined();
    });

    it('should generate unique session IDs', async () => {
      const { sessionId: id1 } = await sessionStore.createSession('user-1');
      const { sessionId: id2 } = await sessionStore.createSession('user-2');

      expect(id1).not.toBe(id2);
    });
  });

  describe('getSession', () => {
    it('should retrieve a session by ID', async () => {
      const userId = 'user-123';
      const { sessionId } = await sessionStore.createSession(userId);

      const retrieved = await sessionStore.getSession(sessionId);

      expect(retrieved).not.toBeNull();
      expect(retrieved?.userId).toBe(userId);
    });

    it('should return null for non-existent session', async () => {
      const retrieved = await sessionStore.getSession('non-existent-id');

      expect(retrieved).toBeNull();
    });
  });

  describe('updateSession', () => {
    it('should update session data', async () => {
      const userId = 'user-123';
      const { sessionId } = await sessionStore.createSession(userId);

      const appleMusicToken = 'apple-music-token-123';
      const updated = await sessionStore.updateSession(sessionId, {
        appleMusicToken,
      });

      expect(updated).not.toBeNull();
      expect(updated?.appleMusicToken).toBe(appleMusicToken);
      expect(updated?.userId).toBe(userId);
    });

    it('should update lastActivityAt on update', async () => {
      const { sessionId, sessionData } = await sessionStore.createSession('user-123');
      const originalLastActivity = sessionData.lastActivityAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const updated = await sessionStore.updateSession(sessionId, {});

      expect(updated?.lastActivityAt).toBeGreaterThan(originalLastActivity);
    });

    it('should return null for non-existent session', async () => {
      const updated = await sessionStore.updateSession('non-existent-id', {});

      expect(updated).toBeNull();
    });
  });

  describe('refreshSession', () => {
    it('should refresh session TTL', async () => {
      const { sessionId } = await sessionStore.createSession('user-123');

      const refreshed = await sessionStore.refreshSession(sessionId);

      expect(refreshed).not.toBeNull();
      expect(refreshed?.userId).toBe('user-123');
    });

    it('should update lastActivityAt on refresh', async () => {
      const { sessionId, sessionData } = await sessionStore.createSession('user-123');
      const originalLastActivity = sessionData.lastActivityAt;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const refreshed = await sessionStore.refreshSession(sessionId);

      expect(refreshed?.lastActivityAt).toBeGreaterThan(originalLastActivity);
    });

    it('should return null for non-existent session', async () => {
      const refreshed = await sessionStore.refreshSession('non-existent-id');

      expect(refreshed).toBeNull();
    });
  });

  describe('deleteSession', () => {
    it('should delete a session', async () => {
      const { sessionId } = await sessionStore.createSession('user-123');

      await sessionStore.deleteSession(sessionId);

      const retrieved = await sessionStore.getSession(sessionId);
      expect(retrieved).toBeNull();
    });
  });

  describe('validateSession', () => {
    it('should return true for valid session', async () => {
      const { sessionId } = await sessionStore.createSession('user-123');

      const isValid = await sessionStore.validateSession(sessionId);

      expect(isValid).toBe(true);
    });

    it('should return false for non-existent session', async () => {
      const isValid = await sessionStore.validateSession('non-existent-id');

      expect(isValid).toBe(false);
    });
  });

  describe('Session Consistency Property', () => {
    it('should maintain session data consistency across multiple accesses', async () => {
      const userId = 'user-123';
      const spotifyAccessToken = 'spotify-token-123';
      const appleMusicToken = 'apple-music-token-123';

      const { sessionId } = await sessionStore.createSession(userId, spotifyAccessToken);

      const session1 = await sessionStore.getSession(sessionId);
      expect(session1?.userId).toBe(userId);
      expect(session1?.spotifyAccessToken).toBe(spotifyAccessToken);

      await sessionStore.updateSession(sessionId, { appleMusicToken });

      const session2 = await sessionStore.getSession(sessionId);
      expect(session2?.userId).toBe(userId);
      expect(session2?.spotifyAccessToken).toBe(spotifyAccessToken);
      expect(session2?.appleMusicToken).toBe(appleMusicToken);

      const session3 = await sessionStore.getSession(sessionId);
      expect(session3?.userId).toBe(userId);
      expect(session3?.spotifyAccessToken).toBe(spotifyAccessToken);
      expect(session3?.appleMusicToken).toBe(appleMusicToken);
    });
  });
});
