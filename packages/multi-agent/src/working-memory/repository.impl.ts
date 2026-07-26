/** Real in-memory {@link SharedWorkingMemoryRepository} implementation. @module working-memory/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { SharedWorkingMemoryEntry } from './types.js';
import type { SharedWorkingMemoryRepository } from './repository.js';

export function createSharedWorkingMemoryRepository(seed?: readonly SharedWorkingMemoryEntry[]): SharedWorkingMemoryRepository {
  const repo = createInMemoryRepository<SharedWorkingMemoryEntry>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((entry) => entry.missionId === missionId);
    },
    async findByKey(organizationId, missionId, key) {
      return repo.list(organizationId).find((entry) => entry.missionId === missionId && entry.key === key) ?? null;
    },
  };
}
