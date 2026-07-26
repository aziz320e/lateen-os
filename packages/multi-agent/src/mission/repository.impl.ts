/** Real in-memory {@link MissionRepository} / {@link MissionObjectiveRepository} implementations. @module mission/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Mission, MissionObjective } from './types.js';
import type { MissionObjectiveRepository, MissionRepository } from './repository.js';

export function createMissionRepository(seed?: readonly Mission[]): MissionRepository {
  const repo = createInMemoryRepository<Mission>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((mission) => mission.code === code) ?? null;
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((mission) => mission.status === status);
    },
  };
}

export function createMissionObjectiveRepository(seed?: readonly MissionObjective[]): MissionObjectiveRepository {
  return createInMemoryRepository<MissionObjective>({ seed });
}
