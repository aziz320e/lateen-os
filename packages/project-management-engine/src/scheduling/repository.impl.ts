/** Real, in-memory Scheduling Engine repository. @module scheduling/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ScheduleRepository } from './repository.js';
import type { Schedule } from './types.js';

/** Creates a real, in-memory {@link ScheduleRepository}. */
export function createScheduleRepository(seed?: readonly Schedule[]): ScheduleRepository {
  const repo = createInMemoryRepository<Schedule>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByProject(organizationId, projectId) {
      return repo.list(organizationId).filter((schedule) => schedule.projectId === projectId);
    },
    async findBaseline(organizationId, projectId) {
      return repo.list(organizationId).find((schedule) => schedule.projectId === projectId && schedule.isBaseline) ?? null;
    },
  };
}
