/** @module approval/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AgentId,
  ApprovalFlowId,
  ApprovalStepId,
  DecisionId,
  EmployeeId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { ApprovalFlowId, ApprovalStepId };

export type ApprovalFlowStatus = 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';

export type ApprovalStepStatus = 'pending' | 'approved' | 'rejected' | 'skipped';

/** Actor authorized to approve a decision step. */
export interface Approver {
  readonly employeeId?: EmployeeId;
  readonly agentId?: AgentId;
  readonly roleCode?: string;
}

/** Single step in an approval workflow. */
export interface ApprovalStep {
  readonly stepId: ApprovalStepId;
  readonly order: number;
  readonly approvers: readonly Approver[];
  readonly status: ApprovalStepStatus;
  readonly decidedBy?: Approver;
  readonly decidedAt?: Timestamp;
  readonly comment?: string;
}

/** Multi-step approval flow for a decision. */
export interface ApprovalFlow extends TenantAuditableEntity<ApprovalFlowId> {
  readonly decisionId: DecisionId;
  readonly steps: readonly ApprovalStep[];
  readonly status: ApprovalFlowStatus;
  readonly currentStepOrder?: number;
}

export type { OrganizationId };
