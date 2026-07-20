/** @module execution/repository */
import type { ExecutionPlanId, ExecutionResultId, OrganizationId, TaskId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { ExecutionPlan, ExecutionResult } from './types.js';

export interface ExecutionPlanRepository extends Repository<ExecutionPlan, ExecutionPlanId> {
  findByTask(organizationId: OrganizationId, taskId: TaskId): Promise<readonly ExecutionPlan[]>;
}

export interface ExecutionResultRepository extends Repository<ExecutionResult, ExecutionResultId> {
  findByPlan(
    organizationId: OrganizationId,
    planId: ExecutionPlanId,
  ): Promise<readonly ExecutionResult[]>;
}
