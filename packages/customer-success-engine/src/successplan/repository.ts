/** @module successplan/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, PlanMilestoneId, PlanObjectiveId, PlanTaskId, SuccessPlanId } from '../shared/identifiers.js';
import type { PlanMilestone, PlanObjective, PlanTask, SuccessPlan } from './types.js';

export interface SuccessPlanRepository extends Repository<SuccessPlan, SuccessPlanId> {
  findAll(organizationId: OrganizationId): Promise<readonly SuccessPlan[]>;
  findByCustomer(organizationId: OrganizationId, customerId: string): Promise<readonly SuccessPlan[]>;
}

export interface PlanObjectiveRepository extends Repository<PlanObjective, PlanObjectiveId> {
  findByPlan(organizationId: OrganizationId, planId: SuccessPlanId): Promise<readonly PlanObjective[]>;
}

export interface PlanMilestoneRepository extends Repository<PlanMilestone, PlanMilestoneId> {
  findByPlan(organizationId: OrganizationId, planId: SuccessPlanId): Promise<readonly PlanMilestone[]>;
}

export interface PlanTaskRepository extends Repository<PlanTask, PlanTaskId> {
  findByPlan(organizationId: OrganizationId, planId: SuccessPlanId): Promise<readonly PlanTask[]>;
}
