import Redis from 'ioredis';
import type { AppConfig } from '../../config/index';

export class CacheService {
  private readonly redis: Redis | null;

  constructor(config: AppConfig) {
    this.redis =
      config.USE_REDIS && config.NODE_ENV !== 'test'
        ? new Redis(config.REDIS_URL, { maxRetriesPerRequest: 1, lazyConnect: true })
        : null;
  }

  async get(key: string): Promise<string | null> {
    if (!this.redis) return null;
    try {
      if (this.redis.status !== 'ready') await this.redis.connect();
      return this.redis.get(key);
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    if (!this.redis) return;
    try {
      if (this.redis.status !== 'ready') await this.redis.connect();
      await this.redis.set(key, value, 'EX', ttlSeconds);
    } catch {
      // cache is best-effort
    }
  }

  async close(): Promise<void> {
    if (this.redis) await this.redis.quit().catch(() => undefined);
  }
}
