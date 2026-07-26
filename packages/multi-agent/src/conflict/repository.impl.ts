/** Real in-memory {@link ConflictRepository} implementation. @module conflict/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Conflict } from './types.js';
import type { ConflictRepository } from './repository.js';

export function createConflictRepository(seed?: readonly Conflict[]): ConflictRepository {
  const repo = createInMemoryRepository<Conflict>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((conflict) => conflict.missionId === missionId);
    },
  };
}
