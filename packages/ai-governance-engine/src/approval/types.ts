/** @module approval/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ApprovalRequestId, GovernanceExceptionId } from '../shared/identifiers.js';

export type { ApprovalRequestId, GovernanceExceptionId };

/** The five categories of deterministic human approval this engine supports. */
export type ApprovalCategory = 'policy_change' | 'security_exception' | 'workflow_publication' | 'model_approval' | 'provider_approval';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export interface ApprovalRequest extends TenantAuditableEntity<ApprovalRequestId> {
  readonly category: ApprovalCategory;
  readonly subjectId: string;
  readonly requestedBy?: string;
  readonly rationale?: string;
  readonly status: ApprovalStatus;
  readonly reviewerId?: string;
  readonly decisionRationale?: string;
  readonly decidedAt?: string;
}

/** A granted governance exception — the durable artifact of an approved `security_exception` request. */
export interface GovernanceException extends TenantAuditableEntity<GovernanceExceptionId> {
  readonly approvalRequestId: ApprovalRequestId;
  readonly subjectId: string;
  readonly grantedBy: string;
  readonly rationale?: string;
  readonly expiresAt?: string;
}
