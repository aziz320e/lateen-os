/** @module trigger/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, TriggerId, WorkflowDefinitionId } from '../shared/identifiers.js';
import type { EventSubjectPattern, Timestamp } from '../shared/primitives.js';

export type { TriggerId };

export type TriggerType = 'manual' | 'scheduled' | 'event';

/** Base trigger contract. */
export interface WorkflowTrigger {
  readonly triggerId: TriggerId;
  readonly definitionId: WorkflowDefinitionId;
  readonly type: TriggerType;
  readonly enabled: boolean;
}

/** Started explicitly by a user or system call. */
export interface ManualTrigger extends WorkflowTrigger {
  readonly type: 'manual';
  readonly allowedRoleIds?: readonly string[];
  readonly allowedEmployeeIds?: readonly string[];
}

/** Started on a cron or interval schedule. */
export interface ScheduledTrigger extends WorkflowTrigger {
  readonly type: 'scheduled';
  readonly cronExpression: string;
  readonly timezone: string;
  readonly nextRunAt?: Timestamp;
}

/** Started when a platform event matches a subject pattern. */
export interface EventTrigger extends WorkflowTrigger {
  readonly type: 'event';
  readonly subjectPattern: EventSubjectPattern;
  readonly filterExpression?: string;
}

/** Persisted trigger configuration. */
export interface TriggerDefinition extends TenantAuditableEntity<TriggerId> {
  readonly definitionId: WorkflowDefinitionId;
  readonly trigger: ManualTrigger | ScheduledTrigger | EventTrigger;
}

export type { OrganizationId, WorkflowDefinitionId };
