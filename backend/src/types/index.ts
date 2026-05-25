/**
 * Common type definitions for the application
 */

export interface User {
  id: string;
  spotifyUserId: string;
  appleMusicUserId?: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface Session {
  id: string;
  userId: string;
  sessionToken: string;
  spotifyAccessToken?: string;
  spotifyRefreshToken?: string;
  spotifyTokenExpiresAt?: Date;
  appleMusicToken?: string;
  appleMusicTokenExpiresAt?: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
}

export interface Playlist {
  id: string;
  userId: string;
  spotifyPlaylistId: string;
  spotifyPlaylistName: string;
  spotifyPlaylistDescription?: string;
  spotifyPlaylistImageUrl?: string;
  spotifyPlaylistPublic: boolean;
  songCount: number;
  cachedAt: Date;
}

export interface ConversionJob {
  id: string;
  userId: string;
  spotifyPlaylistId: string;
  appleMusicPlaylistId?: string;
  appleMusicPlaylistName?: string;
  status: ConversionJobStatus;
  totalSongs: number;
  matchedSongs: number;
  unmatchedSongs: number;
  ambiguousSongs: number;
  startedAt?: Date;
  completedAt?: Date;
  errorMessage?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type ConversionJobStatus =
  | 'pending'
  | 'validating'
  | 'retrieving_songs'
  | 'matching'
  | 'creating_playlist'
  | 'adding_songs'
  | 'completed'
  | 'failed'
  | 'retrying';

export interface SongMatch {
  id: string;
  conversionJobId: string;
  spotifySongId: string;
  spotifySongTitle: string;
  spotifySongArtist: string;
  spotifySongAlbum?: string;
  appleMusicSongId?: string;
  appleMusicSongTitle?: string;
  appleMusicSongArtist?: string;
  matchStatus: MatchStatus;
  confidenceScore?: number;
  matchReason?: string;
  createdAt: Date;
}

export type MatchStatus = 'matched' | 'unmatched' | 'ambiguous';

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: Date;
}

export interface ApiRateLimit {
  id: string;
  userId: string;
  apiProvider: 'spotify' | 'apple_music';
  requestCount: number;
  windowStart: Date;
  windowEnd: Date;
}

export interface ApiError {
  code: string;
  message: string;
  statusCode: number;
  details?: Record<string, unknown>;
}

export interface ConversionProgress {
  jobId: string;
  status: ConversionJobStatus;
  totalSongs: number;
  processedSongs: number;
  matchedSongs: number;
  unmatchedSongs: number;
  ambiguousSongs: number;
  currentSong?: string;
  percentComplete: number;
  estimatedTimeRemaining?: number;
  startedAt: Date;
}

export interface ConversionResult {
  jobId: string;
  spotifyPlaylistId: string;
  appleMusicPlaylistId: string;
  appleMusicPlaylistName: string;
  appleMusicPlaylistUrl: string;
  totalSongs: number;
  matchedSongs: number;
  unmatchedSongs: number;
  ambiguousSongs: number;
  conversionTime: number;
  completedAt: Date;
}

export interface UnmatchedSong {
  spotifySongId: string;
  spotifySongTitle: string;
  spotifySongArtist: string;
  spotifySongAlbum?: string;
  reason: string;
}

export interface SpotifyPlaylist {
  id: string;
  name: string;
  description?: string;
  images?: Array<{ url: string; height?: number; width?: number }>;
  public: boolean;
  tracks: {
    total: number;
    href: string;
  };
}

export interface SpotifyTrack {
  id: string;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string };
  external_ids: { isrc?: string };
}

export interface AppleMusicSong {
  id: string;
  attributes: {
    name: string;
    artistName: string;
    albumName: string;
    url: string;
  };
}

export interface MatchingResult {
  spotifySongId: string;
  spotifySongTitle: string;
  spotifySongArtist: string;
  spotifySongAlbum?: string;
  appleMusicSongId?: string;
  appleMusicSongTitle?: string;
  appleMusicSongArtist?: string;
  matchStatus: MatchStatus;
  confidenceScore: number;
  matchReason?: string;
}
