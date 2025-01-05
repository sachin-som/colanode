import { sha256 } from 'js-sha256';

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

  public async isAuthIpRateLimitted(ip: string): Promise<boolean> {
    const rateLimitKey = this.buildKey(`ai_${ip}`);
    return await this.isRateLimited(rateLimitKey, {
      limit: 100,
      window: 600, // 10 minutes
    });
  }

  public async isAuthEmailRateLimitted(email: string): Promise<boolean> {
    const emailHash = sha256(email);
    const rateLimitKey = this.buildKey(`ae_${emailHash}`);
    return await this.isRateLimited(rateLimitKey, {
      limit: 10,
      window: 600, // 10 minutes
    });
  }

  public async isDeviceApiRateLimitted(deviceId: string): Promise<boolean> {
    const rateLimitKey = this.buildKey(`da_${deviceId}`);
    return await this.isRateLimited(rateLimitKey, {
      limit: 100,
      window: 60, // 1 minute
    });
  }

  public async isDeviceSocketRateLimitted(deviceId: string): Promise<boolean> {
    const rateLimitKey = this.buildKey(`ds_${deviceId}`);
    return await this.isRateLimited(rateLimitKey, {
      limit: 20,
      window: 60, // 1 minute
    });
  }

  private async isRateLimited(
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
    return `rt_${key}`;
  }
}

export const rateLimitService = new RateLimitService();
