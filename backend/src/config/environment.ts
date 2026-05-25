export interface EnvironmentConfig {
  nodeEnv: string;
  port: number;
  host: string;
  database: {
    url: string;
    host: string;
    port: number;
    name: string;
    user: string;
    password: string;
  };
  redis: {
    url: string;
    host: string;
    port: number;
    password?: string;
  };
  spotify: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  appleMusic: {
    teamId: string;
    keyId: string;
    privateKey: string;
  };
  encryption: {
    key: string;
    algorithm: string;
  };
  session: {
    secret: string;
    timeout: number;
    inactivityTimeout: number;
  };
  api: {
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  logging: {
    level: string;
    format: string;
  };
}

export function getEnvironmentConfig(): EnvironmentConfig {
  return {
    nodeEnv: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '3000', 10),
    host: process.env.HOST || 'localhost',
    database: {
      url: process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/spotify_converter',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      name: process.env.DB_NAME || 'spotify_converter',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'password',
    },
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
    },
    spotify: {
      clientId: process.env.SPOTIFY_CLIENT_ID || '',
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET || '',
      redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/spotify/callback',
    },
    appleMusic: {
      teamId: process.env.APPLE_MUSIC_TEAM_ID || '',
      keyId: process.env.APPLE_MUSIC_KEY_ID || '',
      privateKey: process.env.APPLE_MUSIC_PRIVATE_KEY || '',
    },
    encryption: {
      key: process.env.ENCRYPTION_KEY || '',
      algorithm: process.env.ENCRYPTION_ALGORITHM || 'aes-256-gcm',
    },
    session: {
      secret: process.env.SESSION_SECRET || 'your-secret-key',
      timeout: parseInt(process.env.SESSION_TIMEOUT || '86400', 10),
      inactivityTimeout: parseInt(process.env.SESSION_INACTIVITY_TIMEOUT || '1800', 10),
    },
    api: {
      timeout: parseInt(process.env.API_TIMEOUT || '30000', 10),
      retryAttempts: parseInt(process.env.API_RETRY_ATTEMPTS || '3', 10),
      retryDelay: parseInt(process.env.API_RETRY_DELAY || '1000', 10),
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
      format: process.env.LOG_FORMAT || 'json',
    },
  };
}

export default getEnvironmentConfig();
