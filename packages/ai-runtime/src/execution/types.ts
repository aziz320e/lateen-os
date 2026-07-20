/** @module execution/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  ExecutionPlanId,
  ExecutionResultId,
  OrganizationId,
  RuntimeSessionId,
  TaskId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { ExecutionPlanId, ExecutionResultId };

export type ExecutionPlanStatus = 'draft' | 'ready' | 'running' | 'completed' | 'failed';

export interface ExecutionContext {
  readonly sessionId: RuntimeSessionId;
  readonly taskId: TaskId;
  readonly startedAt: Timestamp;
  readonly metadata?: Readonly<Record<string, unknown>>;
}

/** Planned steps for executing a task. */
export interface ExecutionPlan extends TenantAuditableEntity<ExecutionPlanId> {
  readonly taskId: TaskId;
  readonly steps: readonly string[];
  readonly status: ExecutionPlanStatus;
}

/** Outcome of a task execution. */
export interface ExecutionResult extends TenantAuditableEntity<ExecutionResultId> {
  readonly planId: ExecutionPlanId;
  readonly context: ExecutionContext;
  readonly success: boolean;
  readonly output?: string;
  readonly errorCode?: string;
  readonly completedAt: Timestamp;
}

export type { OrganizationId };
