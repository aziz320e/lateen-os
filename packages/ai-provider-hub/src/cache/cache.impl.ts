/**
 * Real in-memory, TTL-expiring {@link ProviderCache} implementation.
 *
 * @module cache/cache.impl
 */
import type { CacheEntry, CacheKey, ProviderCache } from './types.js';
import type { ProviderId } from '../shared/identifiers.js';

function keyToString(key: CacheKey): string {
  return `${key.scope}:${key.providerId}:${key.modelId}:${key.hash}`;
}

/** Creates an in-memory {@link ProviderCache} with real TTL-based expiry. */
export function createInMemoryProviderCache(): ProviderCache {
  const store = new Map<string, CacheEntry>();

  function isExpired(entry: CacheEntry): boolean {
    return new Date(entry.expiresAt).getTime() <= Date.now();
  }

  return {
    async get<T>(key: CacheKey) {
      const cacheKey = keyToString(key);
      const entry = store.get(cacheKey);
      if (!entry) return undefined;
      if (isExpired(entry)) {
        store.delete(cacheKey);
        return undefined;
      }
      const bumped: CacheEntry = { ...entry, hitCount: entry.hitCount + 1 };
      store.set(cacheKey, bumped);
      return bumped as CacheEntry<T>;
    },
    async set<T>(key: CacheKey, value: T, ttlSeconds: number) {
      const now = Date.now();
      const entry: CacheEntry = {
        key,
        value,
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + ttlSeconds * 1000).toISOString(),
        hitCount: 0,
      };
      store.set(keyToString(key), entry);
    },
    async invalidate(key: CacheKey) {
      store.delete(keyToString(key));
    },
    async invalidateByProvider(providerId: ProviderId) {
      for (const [cacheKey, entry] of store) {
        if (entry.key.providerId === providerId) {
          store.delete(cacheKey);
        }
      }
    },
  };
}
