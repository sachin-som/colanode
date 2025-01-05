import { redis } from '@/data/redis';

interface RateLimitConfig {
  limit: number;
  window: number;
}

class RateLimitService {
  private defaultConfig: RateLimitConfig = {
    limit: 10,
    window: 300, // 5 minutes
  };

  public async isRateLimited(
    key: string,
    config: RateLimitConfig = this.defaultConfig
  ): Promise<boolean> {
    const redisKey = this.buildKey(key);
    const attempts = await redis.incr(redisKey);

    // Set expiry on first attempt
    if (attempts === 1) {
      await redis.expire(redisKey, config.window);
    }

    return attempts > config.limit;
  }

  private buildKey(key: string): string {
    return `rate_limit_${key}`;
  }
}

export const rateLimitService = new RateLimitService();
