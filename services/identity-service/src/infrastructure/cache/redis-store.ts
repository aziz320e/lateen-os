import { Redis } from 'ioredis';
import type { SessionStore, RateLimiter } from '../../domain/ports';

export class RedisSessionStore implements SessionStore {
  constructor(
    private readonly redis: Redis,
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

export class InMemorySessionStore implements SessionStore {
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

export class RedisRateLimiter implements RateLimiter {
  constructor(private readonly redis: Redis) {}

  async check(key: string, max: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, windowSeconds);
    }
    const remaining = Math.max(0, max - count);
    return { allowed: count <= max, remaining };
  }
}

export class InMemoryRateLimiter implements RateLimiter {
  private readonly counters = new Map<string, { count: number; expiresAt: number }>();

  async check(key: string, max: number, windowSeconds: number): Promise<{ allowed: boolean; remaining: number }> {
    const now = Date.now();
    const entry = this.counters.get(key);
    if (!entry || now > entry.expiresAt) {
      this.counters.set(key, { count: 1, expiresAt: now + windowSeconds * 1000 });
      return { allowed: true, remaining: max - 1 };
    }
    entry.count += 1;
    const remaining = Math.max(0, max - entry.count);
    return { allowed: entry.count <= max, remaining };
  }
}

export function createSessionStore(redisUrl: string, ttlSeconds: number, nodeEnv: string, useRedis: boolean): SessionStore {
  if (nodeEnv === 'test' && !useRedis) {
    return new InMemorySessionStore();
  }
  return new RedisSessionStore(new Redis(redisUrl), ttlSeconds);
}

export function createRateLimiter(redisUrl: string, nodeEnv: string, useRedis: boolean): RateLimiter {
  if (nodeEnv === 'test' && !useRedis) {
    return new InMemoryRateLimiter();
  }
  return new RedisRateLimiter(new Redis(redisUrl));
}
