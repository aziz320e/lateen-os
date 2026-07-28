/** @module scheduling/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ProjectId } from '../project/types.js';
import type { ScheduleId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { ProjectTaskId } from '../task/types.js';

export type { ScheduleId };

/** One task's computed position within a schedule — early/late start/finish are day offsets from the project start date. */
export interface ScheduleEntry {
  readonly taskId: ProjectTaskId;
  readonly durationDays: number;
  readonly earlyStart: number;
  readonly earlyFinish: number;
  readonly lateStart: number;
  readonly lateFinish: number;
  readonly slack: number;
  readonly isCritical: boolean;
  readonly startDate: ISODate;
  readonly finishDate: ISODate;
}

/** A computed, deterministic critical-path schedule snapshot for a project. At most one snapshot per project may be marked as the baseline. */
export interface Schedule extends TenantAuditableEntity<ScheduleId> {
  readonly projectId: ProjectId;
  readonly projectStartDate: ISODate;
  readonly entries: readonly ScheduleEntry[];
  readonly isBaseline: boolean;
}
