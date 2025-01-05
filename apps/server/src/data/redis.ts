import { createClient } from 'redis';

import { configuration } from '@/lib/configuration';

export const redis = createClient({
  url: configuration.redis.url,
  database: configuration.redis.db,
});

export const initRedis = async () => {
  await redis.connect();

  redis.on('error', (err) => {
    console.error('Redis client error:', err);
  });
};
