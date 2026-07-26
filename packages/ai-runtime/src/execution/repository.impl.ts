/** Real in-memory {@link ExecutionPlanRepository} and {@link ExecutionResultRepository} implementations. @module execution/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ExecutionPlanId, ExecutionResultId } from '../shared/identifiers.js';
import type { ExecutionPlan, ExecutionResult } from './types.js';
import type { ExecutionPlanRepository, ExecutionResultRepository } from './repository.js';

export function createExecutionPlanRepository(seed?: readonly ExecutionPlan[]): ExecutionPlanRepository {
  const repo = createInMemoryRepository<ExecutionPlan, ExecutionPlanId>({ seed });
  return {
    ...repo,
    async findByTask(organizationId, taskId) {
      return repo.list(organizationId).filter((plan) => plan.taskId === taskId);
    },
  };
}

export function createExecutionResultRepository(seed?: readonly ExecutionResult[]): ExecutionResultRepository {
  const repo = createInMemoryRepository<ExecutionResult, ExecutionResultId>({ seed });
  return {
    ...repo,
    async findByPlan(organizationId, planId) {
      return repo.list(organizationId).filter((result) => result.planId === planId);
    },
  };
}
