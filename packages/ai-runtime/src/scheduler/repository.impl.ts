/** Real in-memory {@link ScheduleRepository} implementation. @module scheduler/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ScheduleId } from '../shared/identifiers.js';
import type { Schedule } from './types.js';
import type { ScheduleRepository } from './repository.js';

export function createScheduleRepository(seed?: readonly Schedule[]): ScheduleRepository {
  const repo = createInMemoryRepository<Schedule, ScheduleId>({ seed });
  return {
    ...repo,
    async findByAgent(organizationId, runtimeAgentId) {
      return repo.list(organizationId).filter((schedule) => schedule.runtimeAgentId === runtimeAgentId);
    },
  };
}
