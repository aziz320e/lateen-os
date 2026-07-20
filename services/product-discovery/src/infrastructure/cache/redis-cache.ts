import { Redis } from 'ioredis';
import type { Redis as RedisClient } from 'ioredis';

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  deleteByPrefix(prefix: string): Promise<void>;
}

export class RedisCacheStore implements CacheStore {
  constructor(
    private readonly redis: RedisClient,
    private readonly defaultTtlSeconds: number,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = this.defaultTtlSeconds): Promise<void> {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    const stream = this.redis.scanStream({ match: `${prefix}*`, count: 100 });
    for await (const keys of stream) {
      if (keys.length > 0) await this.redis.del(...keys);
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}

export class InMemoryCacheStore implements CacheStore {
  private readonly store = new Map<string, { value: string; expiresAt?: number }>();

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return JSON.parse(entry.value) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value: JSON.stringify(value),
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async deleteByPrefix(prefix: string): Promise<void> {
    for (const key of [...this.store.keys()]) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}

export function createCacheStore(
  redisUrl: string,
  ttlSeconds: number,
  nodeEnv: string,
  useRedis: boolean,
): CacheStore {
  if (nodeEnv === 'test' && !useRedis) {
    return new InMemoryCacheStore();
  }
  return new RedisCacheStore(new Redis(redisUrl), ttlSeconds);
}
