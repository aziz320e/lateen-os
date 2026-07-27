/** @module approval/repository */
import type { Repository } from '../shared/repository.js';
import type { ApprovalRequestId, GovernanceExceptionId, OrganizationId } from '../shared/identifiers.js';
import type { ApprovalCategory, ApprovalRequest, ApprovalStatus, GovernanceException } from './types.js';

export interface ApprovalRequestRepository extends Repository<ApprovalRequest, ApprovalRequestId> {
  findAll(organizationId: OrganizationId): Promise<readonly ApprovalRequest[]>;
  findByCategory(organizationId: OrganizationId, category: ApprovalCategory): Promise<readonly ApprovalRequest[]>;
  findByStatus(organizationId: OrganizationId, status: ApprovalStatus): Promise<readonly ApprovalRequest[]>;
}

export interface GovernanceExceptionRepository extends Repository<GovernanceException, GovernanceExceptionId> {
  findAll(organizationId: OrganizationId): Promise<readonly GovernanceException[]>;
  findByApprovalRequestId(organizationId: OrganizationId, approvalRequestId: ApprovalRequestId): Promise<GovernanceException | null>;
}
