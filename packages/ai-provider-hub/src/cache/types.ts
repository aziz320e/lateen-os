/** @module cache/types */
import type { ModelId, ProviderId } from '../shared/identifiers.js';

export type CacheKeyScope = 'global' | 'organization' | 'session';

export interface CacheKey {
  readonly scope: CacheKeyScope;
  readonly providerId: ProviderId;
  readonly modelId: ModelId;
  readonly hash: string;
}

export interface CacheEntry<T = unknown> {
  readonly key: CacheKey;
  readonly value: T;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly hitCount: number;
}

export interface CachePolicy {
  readonly enabled: boolean;
  readonly ttlSeconds: number;
  readonly maxEntries: number;
  readonly cacheEmbeddings: boolean;
  readonly cacheCompletions: boolean;
}

export interface ProviderCache {
  get<T>(key: CacheKey): Promise<CacheEntry<T> | undefined>;
  set<T>(key: CacheKey, value: T, ttlSeconds: number): Promise<void>;
  invalidate(key: CacheKey): Promise<void>;
  invalidateByProvider(providerId: ProviderId): Promise<void>;
}
