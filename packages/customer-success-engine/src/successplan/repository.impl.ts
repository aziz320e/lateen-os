/** Real, in-memory Success Plans repositories. @module successplan/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { PlanMilestoneRepository, PlanObjectiveRepository, PlanTaskRepository, SuccessPlanRepository } from './repository.js';
import type { PlanMilestone, PlanObjective, PlanTask, SuccessPlan } from './types.js';

/** Creates a real, in-memory {@link SuccessPlanRepository}. */
export function createSuccessPlanRepository(seed?: readonly SuccessPlan[]): SuccessPlanRepository {
  const repo = createInMemoryRepository<SuccessPlan>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((plan) => plan.customerId === customerId);
    },
  };
}

/** Creates a real, in-memory {@link PlanObjectiveRepository}. */
export function createPlanObjectiveRepository(seed?: readonly PlanObjective[]): PlanObjectiveRepository {
  const repo = createInMemoryRepository<PlanObjective>({ seed });
  return {
    ...repo,
    async findByPlan(organizationId, planId) {
      return repo.list(organizationId).filter((objective) => objective.planId === planId);
    },
  };
}

/** Creates a real, in-memory {@link PlanMilestoneRepository}. */
export function createPlanMilestoneRepository(seed?: readonly PlanMilestone[]): PlanMilestoneRepository {
  const repo = createInMemoryRepository<PlanMilestone>({ seed });
  return {
    ...repo,
    async findByPlan(organizationId, planId) {
      return repo.list(organizationId).filter((milestone) => milestone.planId === planId);
    },
  };
}

/** Creates a real, in-memory {@link PlanTaskRepository}. */
export function createPlanTaskRepository(seed?: readonly PlanTask[]): PlanTaskRepository {
  const repo = createInMemoryRepository<PlanTask>({ seed });
  return {
    ...repo,
    async findByPlan(organizationId, planId) {
      return repo.list(organizationId).filter((task) => task.planId === planId);
    },
  };
}
