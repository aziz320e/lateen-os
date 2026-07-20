/** @module approval/repository */
import type { ApprovalFlowId, DecisionId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { ApprovalFlow, ApprovalFlowStatus } from './types.js';

export interface ApprovalFlowRepository extends Repository<ApprovalFlow, ApprovalFlowId> {
  findByDecision(
    organizationId: OrganizationId,
    decisionId: DecisionId,
  ): Promise<ApprovalFlow | null>;
  findByStatus(
    organizationId: OrganizationId,
    status: ApprovalFlowStatus,
  ): Promise<readonly ApprovalFlow[]>;
}
