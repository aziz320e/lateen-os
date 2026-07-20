/** @module planner/repository */
import type { OrganizationId, PlanId, TaskId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { Plan } from './types.js';

export interface PlanRepository extends Repository<Plan, PlanId> {
  findByTask(organizationId: OrganizationId, taskId: TaskId): Promise<readonly Plan[]>;
}
