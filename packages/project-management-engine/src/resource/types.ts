/** @module resource/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ProjectId } from '../project/types.js';
import type { ProjectTaskId } from '../task/types.js';
import type { ResourceAssignmentId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';

export type { ResourceAssignmentId };

/** `employee` assignments compose with HR Engine; `ai_worker` assignments compose with AI Workforce (via HR Engine's own public integration) — this package never duplicates workforce logic, it only tracks the assignment record. */
export type AssigneeType = 'employee' | 'ai_worker';

export type ResourceAssignmentStatus = 'active' | 'completed' | 'cancelled';

/** A resource (human employee or AI worker) committed to a project, optionally to one specific task, at a given percentage of their capacity. */
export interface ResourceAssignment extends TenantAuditableEntity<ResourceAssignmentId> {
  readonly projectId: ProjectId;
  readonly taskId?: ProjectTaskId;
  readonly assigneeType: AssigneeType;
  /** Opaque foreign key — an HR Engine `EmployeeId` or an AI Workforce worker id. Never redefined here. */
  readonly assigneeId: string;
  readonly allocationPercentage: number;
  readonly startDate?: ISODate;
  readonly endDate?: ISODate;
  readonly status: ResourceAssignmentStatus;
}
