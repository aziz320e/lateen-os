/** @module scheduler/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  RuntimeAgentId,
  ScheduleId,
  TaskId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { ScheduleId };

export type TriggerType = 'cron' | 'interval' | 'event' | 'manual';

/** When and how a task should run. */
export interface Trigger {
  readonly type: TriggerType;
  readonly expression?: string;
  readonly eventName?: string;
  readonly nextRunAt?: Timestamp;
}

/** Schedule binding a task to a trigger. */
export interface Schedule extends TenantAuditableEntity<ScheduleId> {
  readonly taskId: TaskId;
  readonly runtimeAgentId: RuntimeAgentId;
  readonly trigger: Trigger;
  readonly enabled: boolean;
}

export type { OrganizationId };
