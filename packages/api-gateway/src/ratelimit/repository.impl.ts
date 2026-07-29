/** Real, in-memory Rate Limiting and Quota Management repositories. @module ratelimit/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { QuotaRepository, RateLimitCounterRepository, RateLimitPolicyRepository } from './repository.js';
import type { Quota, RateLimitCounter, RateLimitPolicy } from './types.js';

/** Creates a real, in-memory {@link RateLimitPolicyRepository}. */
export function createRateLimitPolicyRepository(seed?: readonly RateLimitPolicy[]): RateLimitPolicyRepository {
  const repo = createInMemoryRepository<RateLimitPolicy>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link RateLimitCounterRepository}. */
export function createRateLimitCounterRepository(seed?: readonly RateLimitCounter[]): RateLimitCounterRepository {
  const repo = createInMemoryRepository<RateLimitCounter>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByPolicyAndPrincipal(organizationId, policyId, principalId) {
      return repo.list(organizationId).find((counter) => counter.policyId === policyId && counter.principalId === principalId) ?? null;
    },
  };
}

/** Creates a real, in-memory {@link QuotaRepository}. */
export function createQuotaRepository(seed?: readonly Quota[]): QuotaRepository {
  const repo = createInMemoryRepository<Quota>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByPrincipal(organizationId, principalId) {
      return repo.list(organizationId).filter((quota) => quota.principalId === principalId);
    },
  };
}
