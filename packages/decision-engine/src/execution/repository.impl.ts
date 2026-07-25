/** Real in-memory {@link DecisionExecutionPlanRepository} implementation. @module execution/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DecisionExecutionPlanId } from '../shared/identifiers.js';
import type { DecisionExecutionPlan } from './types.js';
import type { DecisionExecutionPlanRepository } from './repository.js';

export function createDecisionExecutionPlanRepository(
  seed?: readonly DecisionExecutionPlan[],
): DecisionExecutionPlanRepository {
  const repo = createInMemoryRepository<DecisionExecutionPlan, DecisionExecutionPlanId>({ seed });
  return {
    ...repo,
    async findByDecision(organizationId, decisionId) {
      return repo.list(organizationId).find((plan) => plan.decisionId === decisionId) ?? null;
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((plan) => plan.status === status);
    },
  };
}
