/** Real, in-memory {@link VisionMissionRepository} implementation. @module vision-mission/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { VisionMission } from './types.js';
import type { VisionMissionRepository } from './repository.js';

/** Creates a real, in-memory {@link VisionMissionRepository}. */
export function createVisionMissionRepository(seed?: readonly VisionMission[]): VisionMissionRepository {
  const repo = createInMemoryRepository<VisionMission>({ seed });
  return {
    ...repo,
    async findByOrganization(organizationId) {
      return repo.findById(organizationId, organizationId);
    },
  };
}
