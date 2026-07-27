/** Real, in-memory {@link DomainGraphRepository} implementation. @module graph/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DomainGraph } from './types.js';
import type { DomainGraphRepository } from './repository.js';

/** Creates a real, in-memory {@link DomainGraphRepository}. */
export function createDomainGraphRepository(seed?: readonly DomainGraph[]): DomainGraphRepository {
  const repo = createInMemoryRepository<DomainGraph>({ seed });
  return {
    ...repo,
    async findByOrganization(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((graph) => graph.status === status);
    },
  };
}
