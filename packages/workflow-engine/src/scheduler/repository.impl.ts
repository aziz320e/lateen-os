/** Real in-memory {@link WorkflowScheduleRepository} implementation. @module scheduler/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { WorkflowSchedule } from './types.js';
import type { WorkflowScheduleRepository } from './repository.js';

export function createWorkflowScheduleRepository(seed?: readonly WorkflowSchedule[]): WorkflowScheduleRepository {
  return createInMemoryRepository<WorkflowSchedule>({ seed });
}
