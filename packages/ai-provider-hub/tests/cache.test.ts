import { describe, expect, it, vi } from 'vitest';
import { createInMemoryProviderCache } from '../src/cache/cache.impl.js';
import type { CacheKey } from '../src/cache/types.js';

const KEY: CacheKey = { scope: 'global', providerId: 'openai', modelId: 'gpt-4o', hash: 'abc123' };

describe('createInMemoryProviderCache', () => {
  it('returns undefined for a key that was never set', async () => {
    const cache = createInMemoryProviderCache();
    await expect(cache.get(KEY)).resolves.toBeUndefined();
  });

  it('stores and retrieves a value', async () => {
    const cache = createInMemoryProviderCache();
    await cache.set(KEY, { hello: 'world' }, 60);
    const entry = await cache.get<{ hello: string }>(KEY);
    expect(entry?.value).toEqual({ hello: 'world' });
  });

  it('increments hitCount on repeated reads', async () => {
    const cache = createInMemoryProviderCache();
    await cache.set(KEY, 'v', 60);
    const first = await cache.get(KEY);
    const second = await cache.get(KEY);
    expect(first?.hitCount).toBe(1);
    expect(second?.hitCount).toBe(2);
  });

  it('expires entries after the ttl', async () => {
    vi.useFakeTimers();
    const cache = createInMemoryProviderCache();
    await cache.set(KEY, 'v', 1);
    vi.advanceTimersByTime(1500);
    await expect(cache.get(KEY)).resolves.toBeUndefined();
    vi.useRealTimers();
  });

  it('invalidate removes a single key', async () => {
    const cache = createInMemoryProviderCache();
    await cache.set(KEY, 'v', 60);
    await cache.invalidate(KEY);
    await expect(cache.get(KEY)).resolves.toBeUndefined();
  });

  it('invalidateByProvider removes every entry for that provider', async () => {
    const cache = createInMemoryProviderCache();
    const otherKey: CacheKey = { ...KEY, providerId: 'anthropic', hash: 'xyz' };
    await cache.set(KEY, 'v1', 60);
    await cache.set(otherKey, 'v2', 60);

    await cache.invalidateByProvider('openai');

    await expect(cache.get(KEY)).resolves.toBeUndefined();
    await expect(cache.get(otherKey)).resolves.toBeDefined();
  });
});
