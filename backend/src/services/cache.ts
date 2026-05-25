import { RedisClientType } from 'redis';
import logger from '../config/logger';

/**
 * Cache utility functions for playlist and song match caching
 * Provides abstraction layer for Redis caching operations
 */
export class CacheService {
  private redisClient: RedisClientType;
  private playlistCacheTTL: number; // 5 minutes in seconds
  private songMatchCacheTTL: number; // 30 days in seconds
  private playlistCacheKeyPrefix = 'playlist:';
  private songMatchCacheKeyPrefix = 'song_match:';

  constructor(
    redisClient: RedisClientType,
    playlistCacheTTL = 300,
    songMatchCacheTTL = 2592000
  ) {
    this.redisClient = redisClient;
    this.playlistCacheTTL = playlistCacheTTL;
    this.songMatchCacheTTL = songMatchCacheTTL;
  }

  /**
   * Cache playlist data
   * @param userId - User ID
   * @param playlistId - Spotify playlist ID
   * @param playlistData - Playlist data to cache
   */
  async cachePlaylist(userId: string, playlistId: string, playlistData: any): Promise<void> {
    const key = this.getPlaylistCacheKey(userId, playlistId);
    try {
      await this.redisClient.setEx(key, this.playlistCacheTTL, JSON.stringify(playlistData));
      logger.debug('Playlist cached', { userId, playlistId, ttl: this.playlistCacheTTL });
    } catch (error) {
      logger.error('Failed to cache playlist', { userId, playlistId, error });
    }
  }

  /**
   * Get cached playlist data
   * @param userId - User ID
   * @param playlistId - Spotify playlist ID
   * @returns Cached playlist data or null if not found
   */
  async getPlaylistCache(userId: string, playlistId: string): Promise<any | null> {
    const key = this.getPlaylistCacheKey(userId, playlistId);
    try {
      const data = await this.redisClient.get(key);
      if (data) {
        logger.debug('Playlist cache hit', { userId, playlistId });
        return JSON.parse(data);
      }
      logger.debug('Playlist cache miss', { userId, playlistId });
      return null;
    } catch (error) {
      logger.error('Failed to get playlist cache', { userId, playlistId, error });
      return null;
    }
  }

  /**
   * Invalidate playlist cache
   * @param userId - User ID
   * @param playlistId - Spotify playlist ID
   */
  async invalidatePlaylistCache(userId: string, playlistId: string): Promise<void> {
    const key = this.getPlaylistCacheKey(userId, playlistId);
    try {
      await this.redisClient.del(key);
      logger.debug('Playlist cache invalidated', { userId, playlistId });
    } catch (error) {
      logger.error('Failed to invalidate playlist cache', { userId, playlistId, error });
    }
  }

  /**
   * Invalidate all playlists cache for a user
   * @param userId - User ID
   */
  async invalidateAllPlaylistsCache(userId: string): Promise<void> {
    const pattern = `${this.playlistCacheKeyPrefix}${userId}:*`;
    try {
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(keys);
        logger.debug('All playlists cache invalidated', { userId, count: keys.length });
      }
    } catch (error) {
      logger.error('Failed to invalidate all playlists cache', { userId, error });
    }
  }

  /**
   * Cache song match result
   * @param spotifyArtist - Spotify song artist
   * @param spotifyTitle - Spotify song title
   * @param matchData - Match result data
   */
  async cacheSongMatch(spotifyArtist: string, spotifyTitle: string, matchData: any): Promise<void> {
    const key = this.getSongMatchCacheKey(spotifyArtist, spotifyTitle);
    try {
      await this.redisClient.setEx(key, this.songMatchCacheTTL, JSON.stringify(matchData));
      logger.debug('Song match cached', {
        spotifyArtist,
        spotifyTitle,
        ttl: this.songMatchCacheTTL,
      });
    } catch (error) {
      logger.error('Failed to cache song match', { spotifyArtist, spotifyTitle, error });
    }
  }

  /**
   * Get cached song match result
   * @param spotifyArtist - Spotify song artist
   * @param spotifyTitle - Spotify song title
   * @returns Cached match data or null if not found
   */
  async getSongMatchCache(spotifyArtist: string, spotifyTitle: string): Promise<any | null> {
    const key = this.getSongMatchCacheKey(spotifyArtist, spotifyTitle);
    try {
      const data = await this.redisClient.get(key);
      if (data) {
        logger.debug('Song match cache hit', { spotifyArtist, spotifyTitle });
        return JSON.parse(data);
      }
      logger.debug('Song match cache miss', { spotifyArtist, spotifyTitle });
      return null;
    } catch (error) {
      logger.error('Failed to get song match cache', { spotifyArtist, spotifyTitle, error });
      return null;
    }
  }

  /**
   * Invalidate song match cache
   * @param spotifyArtist - Spotify song artist
   * @param spotifyTitle - Spotify song title
   */
  async invalidateSongMatchCache(spotifyArtist: string, spotifyTitle: string): Promise<void> {
    const key = this.getSongMatchCacheKey(spotifyArtist, spotifyTitle);
    try {
      await this.redisClient.del(key);
      logger.debug('Song match cache invalidated', { spotifyArtist, spotifyTitle });
    } catch (error) {
      logger.error('Failed to invalidate song match cache', { spotifyArtist, spotifyTitle, error });
    }
  }

  /**
   * Cache generic data with custom TTL
   * @param key - Cache key
   * @param data - Data to cache
   * @param ttl - Time to live in seconds
   */
  async set(key: string, data: any, ttl: number): Promise<void> {
    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(data));
      logger.debug('Cache set', { key, ttl });
    } catch (error) {
      logger.error('Failed to set cache', { key, error });
    }
  }

  /**
   * Get generic cached data
   * @param key - Cache key
   * @returns Cached data or null if not found
   */
  async get(key: string): Promise<any | null> {
    try {
      const data = await this.redisClient.get(key);
      if (data) {
        logger.debug('Cache hit', { key });
        return JSON.parse(data);
      }
      logger.debug('Cache miss', { key });
      return null;
    } catch (error) {
      logger.error('Failed to get cache', { key, error });
      return null;
    }
  }

  /**
   * Delete cached data
   * @param key - Cache key
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redisClient.del(key);
      logger.debug('Cache deleted', { key });
    } catch (error) {
      logger.error('Failed to delete cache', { key, error });
    }
  }

  /**
   * Clear all cache (use with caution)
   */
  async clear(): Promise<void> {
    try {
      await this.redisClient.flushDb();
      logger.warn('All cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache', { error });
    }
  }

  /**
   * Get Redis key for playlist cache
   * @param userId - User ID
   * @param playlistId - Spotify playlist ID
   * @returns Redis key
   */
  private getPlaylistCacheKey(userId: string, playlistId: string): string {
    return `${this.playlistCacheKeyPrefix}${userId}:${playlistId}`;
  }

  /**
   * Get Redis key for song match cache
   * @param spotifyArtist - Spotify song artist
   * @param spotifyTitle - Spotify song title
   * @returns Redis key
   */
  private getSongMatchCacheKey(spotifyArtist: string, spotifyTitle: string): string {
    // Normalize the key to ensure consistency
    const normalizedArtist = spotifyArtist.toLowerCase().trim();
    const normalizedTitle = spotifyTitle.toLowerCase().trim();
    return `${this.songMatchCacheKeyPrefix}${normalizedArtist}:${normalizedTitle}`;
  }
}

export default CacheService;
