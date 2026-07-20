/** @module execution/repository */
import type {
  DecisionExecutionPlanId,
  DecisionId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { DecisionExecutionPlan, ExecutionPlanStatus } from './types.js';

export interface DecisionExecutionPlanRepository extends Repository<
  DecisionExecutionPlan,
  DecisionExecutionPlanId
> {
  findByDecision(
    organizationId: OrganizationId,
    decisionId: DecisionId,
  ): Promise<DecisionExecutionPlan | null>;
  findByStatus(
    organizationId: OrganizationId,
    status: ExecutionPlanStatus,
  ): Promise<readonly DecisionExecutionPlan[]>;
}
