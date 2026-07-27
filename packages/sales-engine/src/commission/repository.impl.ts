/** Real, in-memory {@link CommissionPlanRepository} implementation. @module commission/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CommissionPlan } from './types.js';
import type { CommissionPlanRepository } from './repository.js';

/** Creates a real, in-memory {@link CommissionPlanRepository}. */
export function createCommissionPlanRepository(seed?: readonly CommissionPlan[]): CommissionPlanRepository {
  const repo = createInMemoryRepository<CommissionPlan>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((plan) => plan.status === status);
    },
  };
}
