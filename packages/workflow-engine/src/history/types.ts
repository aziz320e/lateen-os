/** @module history/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AuditTrailId,
  ExecutionHistoryId,
  OrganizationId,
  StepInstanceId,
  WorkflowHistoryId,
  WorkflowInstanceId,
  WorkflowStepId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { WorkflowHistoryId, ExecutionHistoryId, AuditTrailId };

export type HistoryEventType =
  | 'instance_started'
  | 'instance_completed'
  | 'instance_failed'
  | 'instance_cancelled'
  | 'step_started'
  | 'step_completed'
  | 'step_failed'
  | 'step_skipped'
  | 'transition_taken'
  | 'approval_requested'
  | 'approval_resolved'
  | 'variable_updated';

/** Chronological workflow instance history. */
export interface WorkflowHistory extends TenantAuditableEntity<WorkflowHistoryId> {
  readonly instanceId: WorkflowInstanceId;
  readonly eventType: HistoryEventType;
  readonly stepId?: WorkflowStepId;
  readonly stepInstanceId?: StepInstanceId;
  readonly summary: string;
  readonly occurredAt: Timestamp;
  readonly actorId?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Step-level execution history with timing. */
export interface ExecutionHistory extends TenantAuditableEntity<ExecutionHistoryId> {
  readonly instanceId: WorkflowInstanceId;
  readonly stepInstanceId: StepInstanceId;
  readonly stepId: WorkflowStepId;
  readonly status: string;
  readonly durationMs: number;
  readonly startedAt: Timestamp;
  readonly completedAt?: Timestamp;
  readonly outputSummary?: string;
}

/** Immutable audit trail entry for compliance. */
export interface AuditTrail extends TenantAuditableEntity<AuditTrailId> {
  readonly instanceId: WorkflowInstanceId;
  readonly action: string;
  readonly actorType: 'employee' | 'worker' | 'system' | 'service';
  readonly actorId: string;
  readonly resourceType: string;
  readonly resourceId: string;
  readonly occurredAt: Timestamp;
  readonly details?: Readonly<Record<string, unknown>>;
}

export type { OrganizationId, WorkflowInstanceId };
