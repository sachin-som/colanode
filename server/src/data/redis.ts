import { createClient } from 'redis';

const REDIS_URL = process.env.REDIS_URL || '';
export const redis = createClient({
  url: REDIS_URL,
});

export const initRedis = async () => {
  await redis.connect();

  redis.on('error', (err) => {
    console.error('Redis client error:', err);
  });
};

export const CHANNEL_NAMES = {
  UPDATES: process.env.REDIS_UPDATES_CHANNEL_NAME || 'neuron_updates',
};
