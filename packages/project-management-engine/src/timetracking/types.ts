/** @module timetracking/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ProjectId } from '../project/types.js';
import type { WorkLogId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';
import type { ProjectTaskId } from '../task/types.js';

export type { WorkLogId };

/** An immutable record of hours logged against one task by one assignee on one day. */
export interface WorkLog extends TenantAuditableEntity<WorkLogId> {
  readonly projectId: ProjectId;
  readonly taskId: ProjectTaskId;
  /** Opaque foreign key — an HR Engine `EmployeeId` or an AI Workforce worker id. */
  readonly assigneeId: string;
  readonly workDate: ISODate;
  readonly hoursLogged: number;
  readonly isOvertime: boolean;
  readonly notes?: string;
}
