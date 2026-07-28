/** @module task/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ProjectId } from '../project/types.js';
import type { ProjectTaskId } from '../shared/identifiers.js';
import type { ISODate } from '../shared/primitives.js';

export type { ProjectTaskId };

export type TaskStatus = 'planned' | 'ready' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';

export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';

/** A task or subtask within a project, with dependencies, priority, labels, and a due date. */
export interface ProjectTask extends TenantAuditableEntity<ProjectTaskId> {
  readonly projectId: ProjectId;
  /** Present when this task is a subtask of another. */
  readonly parentTaskId?: ProjectTaskId;
  readonly title: string;
  readonly description?: string;
  readonly priority: TaskPriority;
  readonly labels: readonly string[];
  readonly dueDate?: ISODate;
  readonly dependsOnTaskIds: readonly ProjectTaskId[];
  /** Planned effort, in hours — compared against logged actual hours by the Time Tracking module. */
  readonly estimatedHours?: number;
  readonly status: TaskStatus;
  readonly currentVersion: number;
}
