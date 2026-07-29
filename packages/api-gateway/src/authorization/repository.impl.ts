/** Real, in-memory Authorization Policy repository. @module authorization/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PolicyRepository } from './repository.js';
import type { Policy } from './types.js';

/** Creates a real, in-memory {@link PolicyRepository}. */
export function createPolicyRepository(seed?: readonly Policy[]): PolicyRepository {
  const repo = createInMemoryRepository<Policy>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
  };
}
