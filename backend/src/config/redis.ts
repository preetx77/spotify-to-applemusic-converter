import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;

export async function initializeRedis() {
  if (redisClient) {
    return redisClient;
  }

  const client = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 50, 500),
    },
  });

  client.on('error', (err: Error) => {
    console.error('Redis Client Error', err);
  });

  client.on('connect', () => {
    console.log('Redis Client Connected');
  });

  await client.connect();
  redisClient = client;
  return client;
}

export function getRedisClient() {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
}

export async function closeRedis(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export default { initializeRedis, getRedisClient, closeRedis };
