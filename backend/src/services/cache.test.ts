import { CacheService } from './cache';

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

  async flushDb(): Promise<any> {
    this.store.clear();
    this.ttls.clear();
    return 'OK';
  }

  clear(): void {
    this.store.clear();
    this.ttls.clear();
  }
}

describe('CacheService', () => {
  let cacheService: CacheService;
  let mockRedis: MockRedisClient;

  beforeEach(() => {
    mockRedis = new MockRedisClient();
    cacheService = new CacheService(mockRedis as any, 300, 2592000);
  });

  describe('Playlist Caching', () => {
    it('should cache playlist data', async () => {
      const userId = 'user-123';
      const playlistId = 'playlist-456';
      const playlistData = {
        name: 'My Playlist',
        description: 'A test playlist',
        songCount: 50,
      };

      await cacheService.cachePlaylist(userId, playlistId, playlistData);

      const cached = await cacheService.getPlaylistCache(userId, playlistId);

      expect(cached).toEqual(playlistData);
    });

    it('should return null for non-existent playlist cache', async () => {
      const cached = await cacheService.getPlaylistCache('user-123', 'non-existent');

      expect(cached).toBeNull();
    });

    it('should invalidate playlist cache', async () => {
      const userId = 'user-123';
      const playlistId = 'playlist-456';
      const playlistData = { name: 'My Playlist' };

      await cacheService.cachePlaylist(userId, playlistId, playlistData);
      await cacheService.invalidatePlaylistCache(userId, playlistId);

      const cached = await cacheService.getPlaylistCache(userId, playlistId);

      expect(cached).toBeNull();
    });

    it('should invalidate all playlists cache for a user', async () => {
      const userId = 'user-123';

      await cacheService.cachePlaylist(userId, 'playlist-1', { name: 'Playlist 1' });
      await cacheService.cachePlaylist(userId, 'playlist-2', { name: 'Playlist 2' });
      await cacheService.cachePlaylist(userId, 'playlist-3', { name: 'Playlist 3' });

      await cacheService.invalidateAllPlaylistsCache(userId);

      const cached1 = await cacheService.getPlaylistCache(userId, 'playlist-1');
      const cached2 = await cacheService.getPlaylistCache(userId, 'playlist-2');
      const cached3 = await cacheService.getPlaylistCache(userId, 'playlist-3');

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
      expect(cached3).toBeNull();
    });

    it('should not invalidate other users playlists', async () => {
      const user1 = 'user-1';
      const user2 = 'user-2';
      const playlistId = 'playlist-456';

      await cacheService.cachePlaylist(user1, playlistId, { name: 'User 1 Playlist' });
      await cacheService.cachePlaylist(user2, playlistId, { name: 'User 2 Playlist' });

      await cacheService.invalidateAllPlaylistsCache(user1);

      const cached1 = await cacheService.getPlaylistCache(user1, playlistId);
      const cached2 = await cacheService.getPlaylistCache(user2, playlistId);

      expect(cached1).toBeNull();
      expect(cached2).not.toBeNull();
    });
  });

  describe('Song Match Caching', () => {
    it('should cache song match result', async () => {
      const artist = 'The Beatles';
      const title = 'Let It Be';
      const matchData = {
        appleMusicSongId: 'am-123',
        appleMusicTitle: 'Let It Be',
        confidence: 0.98,
      };

      await cacheService.cacheSongMatch(artist, title, matchData);

      const cached = await cacheService.getSongMatchCache(artist, title);

      expect(cached).toEqual(matchData);
    });

    it('should normalize artist and title for cache key', async () => {
      const artist = 'The Beatles';
      const title = 'Let It Be';
      const matchData = { appleMusicSongId: 'am-123' };

      await cacheService.cacheSongMatch(artist, title, matchData);

      const cached = await cacheService.getSongMatchCache('THE BEATLES', 'LET IT BE');

      expect(cached).toEqual(matchData);
    });

    it('should return null for non-existent song match cache', async () => {
      const cached = await cacheService.getSongMatchCache('Unknown Artist', 'Unknown Song');

      expect(cached).toBeNull();
    });

    it('should invalidate song match cache', async () => {
      const artist = 'The Beatles';
      const title = 'Let It Be';
      const matchData = { appleMusicSongId: 'am-123' };

      await cacheService.cacheSongMatch(artist, title, matchData);
      await cacheService.invalidateSongMatchCache(artist, title);

      const cached = await cacheService.getSongMatchCache(artist, title);

      expect(cached).toBeNull();
    });
  });

  describe('Generic Cache Operations', () => {
    it('should set and get generic cache data', async () => {
      const key = 'test-key';
      const data = { value: 'test-value', number: 42 };

      await cacheService.set(key, data, 3600);

      const cached = await cacheService.get(key);

      expect(cached).toEqual(data);
    });

    it('should delete cache data', async () => {
      const key = 'test-key';
      const data = { value: 'test-value' };

      await cacheService.set(key, data, 3600);
      await cacheService.delete(key);

      const cached = await cacheService.get(key);

      expect(cached).toBeNull();
    });

    it('should clear all cache', async () => {
      await cacheService.set('key-1', { value: 1 }, 3600);
      await cacheService.set('key-2', { value: 2 }, 3600);
      await cacheService.cachePlaylist('user-1', 'playlist-1', { name: 'Playlist' });

      await cacheService.clear();

      const cached1 = await cacheService.get('key-1');
      const cached2 = await cacheService.get('key-2');
      const cachedPlaylist = await cacheService.getPlaylistCache('user-1', 'playlist-1');

      expect(cached1).toBeNull();
      expect(cached2).toBeNull();
      expect(cachedPlaylist).toBeNull();
    });
  });

  describe('Cache Hit/Miss Scenarios', () => {
    it('should handle multiple cache hits', async () => {
      const key = 'test-key';
      const data = { value: 'test-value' };

      await cacheService.set(key, data, 3600);

      const hit1 = await cacheService.get(key);
      const hit2 = await cacheService.get(key);
      const hit3 = await cacheService.get(key);

      expect(hit1).toEqual(data);
      expect(hit2).toEqual(data);
      expect(hit3).toEqual(data);
    });

    it('should handle cache misses gracefully', async () => {
      const miss1 = await cacheService.get('non-existent-1');
      const miss2 = await cacheService.get('non-existent-2');
      const miss3 = await cacheService.get('non-existent-3');

      expect(miss1).toBeNull();
      expect(miss2).toBeNull();
      expect(miss3).toBeNull();
    });

    it('should handle mixed cache hits and misses', async () => {
      await cacheService.set('key-1', { value: 1 }, 3600);
      await cacheService.set('key-3', { value: 3 }, 3600);

      const result1 = await cacheService.get('key-1');
      const result2 = await cacheService.get('key-2');
      const result3 = await cacheService.get('key-3');

      expect(result1).toEqual({ value: 1 });
      expect(result2).toBeNull();
      expect(result3).toEqual({ value: 3 });
    });
  });

  describe('Complex Data Caching', () => {
    it('should cache complex nested objects', async () => {
      const complexData = {
        playlist: {
          id: 'playlist-123',
          name: 'My Playlist',
          songs: [
            { id: 'song-1', title: 'Song 1', artist: 'Artist 1' },
            { id: 'song-2', title: 'Song 2', artist: 'Artist 2' },
          ],
          metadata: {
            created: '2024-01-01',
            updated: '2024-01-15',
            isPublic: true,
          },
        },
      };

      await cacheService.set('complex-key', complexData, 3600);

      const cached = await cacheService.get('complex-key');

      expect(cached).toEqual(complexData);
    });

    it('should cache arrays', async () => {
      const arrayData = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
        { id: 3, name: 'Item 3' },
      ];

      await cacheService.set('array-key', arrayData, 3600);

      const cached = await cacheService.get('array-key');

      expect(cached).toEqual(arrayData);
    });
  });
});
