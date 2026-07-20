/** @module scheduler/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  TriggerId,
  WorkflowDefinitionId,
  WorkflowScheduleId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { WorkflowScheduleId };

export type ScheduleStatus = 'active' | 'paused' | 'completed' | 'cancelled';

/** Scheduled workflow execution plan. */
export interface WorkflowSchedule extends TenantAuditableEntity<WorkflowScheduleId> {
  readonly definitionId: WorkflowDefinitionId;
  readonly triggerId: TriggerId;
  readonly cronExpression: string;
  readonly timezone: string;
  readonly status: ScheduleStatus;
  readonly nextRunAt: Timestamp;
  readonly lastRunAt?: Timestamp;
  readonly runCount: number;
  readonly maxRuns?: number;
}

export type { OrganizationId, WorkflowDefinitionId, TriggerId };
