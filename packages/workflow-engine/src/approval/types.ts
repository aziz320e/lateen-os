/** @module approval/types */
import type { DecisionId } from '@lateen-os/decision-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  ApprovalChainId,
  ApprovalStepId,
  EmployeeId,
  OrganizationId,
  RoleId,
  StepInstanceId,
  WorkflowStepId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { ApprovalStepId, ApprovalChainId };

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'escalated' | 'expired';

export type ApproverType = 'employee' | 'role' | 'supervisor' | 'decision_engine';

/** Individual approver in an approval chain. */
export interface Approver {
  readonly type: ApproverType;
  readonly employeeId?: EmployeeId;
  readonly roleId?: RoleId;
  readonly order: number;
}

/** Approval step within a workflow — coordinates human or engine approval. */
export interface ApprovalStep extends TenantAuditableEntity<ApprovalStepId> {
  readonly workflowStepId: WorkflowStepId;
  readonly stepInstanceId?: StepInstanceId;
  readonly title: string;
  readonly status: ApprovalStatus;
  readonly approvers: readonly Approver[];
  readonly decisionId?: DecisionId;
  readonly dueAt?: Timestamp;
  readonly resolvedAt?: Timestamp;
  readonly resolvedBy?: EmployeeId;
}

/** Ordered chain of approval steps for a workflow segment. */
export interface ApprovalChain extends TenantAuditableEntity<ApprovalChainId> {
  readonly name: string;
  readonly stepIds: readonly ApprovalStepId[];
  readonly parallel: boolean;
  readonly requireAll: boolean;
}

export type { OrganizationId, EmployeeId, RoleId };
