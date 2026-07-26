/** Real in-memory {@link PlanRepository} implementation. @module planner/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PlanId } from '../shared/identifiers.js';
import type { Plan } from './types.js';
import type { PlanRepository } from './repository.js';

export function createPlanRepository(seed?: readonly Plan[]): PlanRepository {
  const repo = createInMemoryRepository<Plan, PlanId>({ seed });
  return {
    ...repo,
    async findByTask(organizationId, taskId) {
      return repo.list(organizationId).filter((plan) => plan.taskId === taskId);
    },
  };
}
