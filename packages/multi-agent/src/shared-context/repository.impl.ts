/** Real in-memory shared-context repository implementations. @module shared-context/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SharedBusinessContext, SharedDecisionReference, SharedMemoryReference } from './types.js';
import type {
  SharedBusinessContextRepository,
  SharedDecisionReferenceRepository,
  SharedMemoryReferenceRepository,
} from './repository.js';

export function createSharedBusinessContextRepository(seed?: readonly SharedBusinessContext[]): SharedBusinessContextRepository {
  const repo = createInMemoryRepository<SharedBusinessContext>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).find((context) => context.missionId === missionId) ?? null;
    },
  };
}

export function createSharedMemoryReferenceRepository(seed?: readonly SharedMemoryReference[]): SharedMemoryReferenceRepository {
  return createInMemoryRepository<SharedMemoryReference>({ seed });
}

export function createSharedDecisionReferenceRepository(seed?: readonly SharedDecisionReference[]): SharedDecisionReferenceRepository {
  return createInMemoryRepository<SharedDecisionReference>({ seed });
}
