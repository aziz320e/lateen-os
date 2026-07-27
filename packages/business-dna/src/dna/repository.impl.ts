/** Real, in-memory {@link BusinessDnaProfileRepository} implementation. @module dna/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { BusinessDnaProfile } from './types.js';
import type { BusinessDnaProfileRepository } from './repository.js';

/** Creates a real, in-memory {@link BusinessDnaProfileRepository}. */
export function createBusinessDnaProfileRepository(seed?: readonly BusinessDnaProfile[]): BusinessDnaProfileRepository {
  const repo = createInMemoryRepository<BusinessDnaProfile>({ seed });
  return {
    ...repo,
    async findByOrganization(organizationId) {
      return repo.findById(organizationId, organizationId);
    },
  };
}
