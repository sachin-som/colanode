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
  MUTATIONS: process.env.REDIS_MUTATIONS_CHANNEL_NAME || 'neuron_mutations',
};
