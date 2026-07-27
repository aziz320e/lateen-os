/** Real, in-memory {@link PolicyRepository} implementation. @module policy/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Policy } from './types.js';
import type { PolicyRepository } from './repository.js';

/** Creates a real, in-memory {@link PolicyRepository}. */
export function createPolicyRepository(seed?: readonly Policy[]): PolicyRepository {
  const repo = createInMemoryRepository<Policy>({ seed });
  return {
    ...repo,
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((policy) => policy.code === code) ?? null;
    },
    async findByType(organizationId, type) {
      return repo.list(organizationId).filter((policy) => policy.type === type);
    },
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
