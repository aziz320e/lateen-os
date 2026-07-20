/** @module task/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, RuntimeAgentId, TaskId } from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { TaskId };

export type TaskPriority = 'critical' | 'high' | 'normal' | 'low' | 'background';

export type TaskStatus =
  | 'queued'
  | 'assigned'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TaskResult {
  readonly success: boolean;
  readonly output?: string;
  readonly errorCode?: string;
  readonly completedAt?: Timestamp;
}

/** Unit of work assigned to a runtime agent. */
export interface Task extends TenantAuditableEntity<TaskId> {
  readonly title: string;
  readonly description?: string;
  readonly runtimeAgentId: RuntimeAgentId;
  readonly priority: TaskPriority;
  readonly status: TaskStatus;
  readonly result?: TaskResult;
  readonly scheduledAt?: Timestamp;
}

/** Ordered queue of tasks for an agent or organization. */
export interface TaskQueue {
  readonly organizationId: OrganizationId;
  readonly runtimeAgentId?: RuntimeAgentId;
  readonly taskIds: readonly TaskId[];
}

export type { OrganizationId };
