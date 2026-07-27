/** Real, in-memory {@link ToolPolicyRepository} implementation. @module tool-security/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ToolPolicy } from './types.js';
import type { ToolPolicyRepository } from './repository.js';

/** Creates a real, in-memory {@link ToolPolicyRepository}. */
export function createToolPolicyRepository(seed?: readonly ToolPolicy[]): ToolPolicyRepository {
  const repo = createInMemoryRepository<ToolPolicy>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((policy) => policy.status === status);
    },
  };
}
