/** @module planner/planner */
import type { OrganizationId, PlanId, TaskId } from '../shared/identifiers.js';
import type { Plan } from './types.js';

/** Port for planning task execution (implementation external to this package). */
export interface Planner {
  createPlan(organizationId: OrganizationId, taskId: TaskId): Promise<Plan>;

  refinePlan(organizationId: OrganizationId, planId: PlanId): Promise<Plan>;
}
