/** @module availability/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  AvailabilityScheduleId,
  OrganizationId,
  WorkerId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';
import type { AvailabilityState } from '../worker/types.js';

export type { AvailabilityScheduleId };

export type DayOfWeek = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

/** Time slot when a worker is available for assignment. */
export interface AvailabilitySlot {
  readonly dayOfWeek: DayOfWeek;
  readonly startTime: string;
  readonly endTime: string;
  readonly timezone: string;
}

/** Recurring availability schedule for a worker. */
export interface AvailabilitySchedule extends TenantAuditableEntity<AvailabilityScheduleId> {
  readonly workerId: WorkerId;
  readonly state: AvailabilityState;
  readonly slots: readonly AvailabilitySlot[];
  readonly effectiveFrom: Timestamp;
  readonly effectiveUntil?: Timestamp;
  readonly maxConcurrentTasks: number;
}

/** Query result for worker availability at a point in time. */
export interface AvailabilitySnapshot {
  readonly workerId: WorkerId;
  readonly state: AvailabilityState;
  readonly availableCapacity: number;
  readonly checkedAt: Timestamp;
}

export type { OrganizationId, WorkerId };
