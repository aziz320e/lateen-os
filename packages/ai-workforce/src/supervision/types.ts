/** @module supervision/types */
import type { DecisionId } from '@lateen-os/decision-engine';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  EmployeeId,
  EscalationId,
  OrganizationId,
  ReviewId,
  SupervisorId,
  WorkerId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { SupervisorId, ReviewId, EscalationId };

export type ReviewStatus = 'pending' | 'in_review' | 'approved' | 'rejected' | 'escalated';

export type ReviewSubjectType = 'task' | 'recommendation' | 'delegation' | 'goal' | 'performance';

export type EscalationLevel = 'supervisor' | 'manager' | 'executive' | 'decision_engine';

/** Human or AI supervisor responsible for workforce oversight. */
export interface Supervisor extends TenantAuditableEntity<SupervisorId> {
  readonly employeeId: EmployeeId;
  readonly workerIds: readonly WorkerId[];
  readonly departmentId?: string;
  readonly canApproveDecisions: boolean;
  readonly canEscalate: boolean;
}

/** Supervisory review of worker output or behavior. */
export interface Review extends TenantAuditableEntity<ReviewId> {
  readonly supervisorId: SupervisorId;
  readonly subjectWorkerId: WorkerId;
  readonly subjectType: ReviewSubjectType;
  readonly subjectReferenceId: string;
  readonly status: ReviewStatus;
  readonly summary: string;
  readonly findings?: string;
  readonly reviewedAt?: Timestamp;
}

/** Escalation when a worker cannot proceed autonomously. */
export interface Escalation extends TenantAuditableEntity<EscalationId> {
  readonly workerId: WorkerId;
  readonly supervisorId?: SupervisorId;
  readonly level: EscalationLevel;
  readonly reason: string;
  readonly decisionId?: DecisionId;
  readonly status: 'open' | 'acknowledged' | 'resolved' | 'closed';
  readonly escalatedAt: Timestamp;
  readonly resolvedAt?: Timestamp;
}

export type { OrganizationId, WorkerId, EmployeeId };
