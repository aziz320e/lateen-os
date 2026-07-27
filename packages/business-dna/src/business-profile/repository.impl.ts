/** Real, in-memory {@link BusinessProfileRepository} implementation. @module business-profile/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { BusinessProfile } from './types.js';
import type { BusinessProfileRepository } from './repository.js';

/** Creates a real, in-memory {@link BusinessProfileRepository}. */
export function createBusinessProfileRepository(seed?: readonly BusinessProfile[]): BusinessProfileRepository {
  const repo = createInMemoryRepository<BusinessProfile>({ seed });
  return {
    ...repo,
    async findByOrganization(organizationId) {
      return repo.findById(organizationId, organizationId);
    },
  };
}
