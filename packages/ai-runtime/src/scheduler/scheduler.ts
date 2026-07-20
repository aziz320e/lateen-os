/** @module scheduler/scheduler */
import type { OrganizationId, ScheduleId, TaskId } from '../shared/identifiers.js';
import type { Schedule } from './types.js';

/** Port for scheduling agent tasks (implementation external to this package). */
export interface Scheduler {
  scheduleTask(organizationId: OrganizationId, taskId: TaskId): Promise<Schedule>;

  cancelSchedule(organizationId: OrganizationId, scheduleId: ScheduleId): Promise<void>;

  listDueSchedules(organizationId: OrganizationId, asOf: Date): Promise<readonly Schedule[]>;
}
