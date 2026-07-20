import Redis from 'ioredis';

export interface MarketplaceCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  close(): Promise<void>;
}

class NoOpMarketplaceCache implements MarketplaceCache {
  async get(): Promise<string | null> {
    return null;
  }
  async set(): Promise<void> {}
  async close(): Promise<void> {}
}

class RedisMarketplaceCache implements MarketplaceCache {
  constructor(private readonly client: Redis) {}

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string, ttlSeconds = 300): Promise<void> {
    await this.client.set(key, value, 'EX', ttlSeconds);
  }

  async close(): Promise<void> {
    await this.client.quit();
  }
}

export function createMarketplaceCache(enabled: boolean, redisUrl: string): MarketplaceCache {
  if (!enabled) return new NoOpMarketplaceCache();
  return new RedisMarketplaceCache(new Redis(redisUrl));
}
