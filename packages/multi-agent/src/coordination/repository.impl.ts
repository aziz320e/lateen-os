/** Real in-memory coordination repository implementations. @module coordination/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CoordinationPlan, CoordinationPolicy, CoordinationStep, Coordinator } from './types.js';
import type {
  CoordinationPlanRepository,
  CoordinationPolicyRepository,
  CoordinationStepRepository,
  CoordinatorRepository,
} from './repository.js';

export function createCoordinatorRepository(seed?: readonly Coordinator[]): CoordinatorRepository {
  const repo = createInMemoryRepository<Coordinator>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).find((coordinator) => coordinator.missionId === missionId) ?? null;
    },
  };
}

export function createCoordinationPlanRepository(seed?: readonly CoordinationPlan[]): CoordinationPlanRepository {
  const repo = createInMemoryRepository<CoordinationPlan>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).find((plan) => plan.missionId === missionId) ?? null;
    },
  };
}

export function createCoordinationStepRepository(seed?: readonly CoordinationStep[]): CoordinationStepRepository {
  const repo = createInMemoryRepository<CoordinationStep>({ seed });
  return {
    ...repo,
    async findByPlan(organizationId, planId) {
      return repo.list(organizationId).filter((step) => step.planId === planId);
    },
  };
}

export function createCoordinationPolicyRepository(seed?: readonly CoordinationPolicy[]): CoordinationPolicyRepository {
  const repo = createInMemoryRepository<CoordinationPolicy>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).find((policy) => policy.missionId === missionId) ?? null;
    },
  };
}
