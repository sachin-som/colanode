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
    return await this.isRateLimited(`ai:${ip}`, {
      limit: 100,
      window: 600, // 10 minutes
    });
  }

  public async isAuthEmailRateLimitted(email: string): Promise<boolean> {
    const emailHash = sha256(email);
    return await this.isRateLimited(`ae:${emailHash}`, {
      limit: 10,
      window: 600, // 10 minutes
    });
  }

  public async isDeviceApiRateLimitted(deviceId: string): Promise<boolean> {
    return await this.isRateLimited(`da:${deviceId}`, {
      limit: 100,
      window: 60, // 1 minute
    });
  }

  public async isDeviceSocketRateLimitted(deviceId: string): Promise<boolean> {
    return await this.isRateLimited(`ds:${deviceId}`, {
      limit: 20,
      window: 60, // 1 minute
    });
  }

  private async isRateLimited(
    key: string,
    config: RateLimitConfig = this.defaultConfig
  ): Promise<boolean> {
    const redisKey = `rt:${key}`;
    const attempts = await redis.incr(redisKey);

    // Set expiry on first attempt
    if (attempts === 1) {
      await redis.expire(redisKey, config.window);
    }

    return attempts > config.limit;
  }
}

export const rateLimitService = new RateLimitService();
