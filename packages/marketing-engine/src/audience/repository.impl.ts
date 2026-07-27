/** Real, in-memory {@link AudienceRepository} implementation. @module audience/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Audience } from './types.js';
import type { AudienceRepository } from './repository.js';

/** Creates a real, in-memory {@link AudienceRepository}. */
export function createAudienceRepository(seed?: readonly Audience[]): AudienceRepository {
  const repo = createInMemoryRepository<Audience>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((audience) => audience.status === status);
    },
    async findByType(organizationId, audienceType) {
      return repo.list(organizationId).filter((audience) => audience.audienceType === audienceType);
    },
  };
}
