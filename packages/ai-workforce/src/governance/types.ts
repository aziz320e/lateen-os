/** @module governance/types */
import type { DecisionId } from '@lateen-os/decision-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  ApprovalRequirementId,
  ComplianceCheckId,
  OrganizationId,
  WorkerId,
  WorkforceAuditRecordId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { ApprovalRequirementId, ComplianceCheckId, WorkforceAuditRecordId };

export type ApprovalRequirementStatus = 'required' | 'satisfied' | 'waived' | 'expired';

export type ComplianceStatus = 'pending' | 'passed' | 'failed' | 'waived';

export type AuditAction =
  | 'worker_registered'
  | 'worker_activated'
  | 'task_assigned'
  | 'delegation_requested'
  | 'delegation_completed'
  | 'review_submitted'
  | 'escalation_opened'
  | 'goal_updated'
  | 'decision_submitted'
  | 'policy_violation';

/** Requirement that human approval must precede an action. */
export interface ApprovalRequirement extends TenantAuditableEntity<ApprovalRequirementId> {
  readonly workerId: WorkerId;
  readonly action: AuditAction;
  readonly referenceId: string;
  readonly decisionId?: DecisionId;
  readonly status: ApprovalRequirementStatus;
  readonly requiredBy?: Timestamp;
  readonly satisfiedAt?: Timestamp;
}

/** Compliance check result for workforce governance. */
export interface ComplianceCheck extends TenantAuditableEntity<ComplianceCheckId> {
  readonly workerId: WorkerId;
  readonly policyCode: string;
  readonly policyName: string;
  readonly status: ComplianceStatus;
  readonly findings?: string;
  readonly checkedAt: Timestamp;
  readonly checkedBy?: string;
}

/** Immutable audit record for workforce actions. */
export interface AuditRecord extends TenantAuditableEntity<WorkforceAuditRecordId> {
  readonly workerId: WorkerId;
  readonly action: AuditAction;
  readonly referenceType: string;
  readonly referenceId: string;
  readonly summary: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
  readonly occurredAt: Timestamp;
}

export type { OrganizationId, WorkerId };
