/** @module timetracking/repository */
import type { ProjectId } from '../project/types.js';
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, WorkLogId } from '../shared/identifiers.js';
import type { ProjectTaskId } from '../task/types.js';
import type { WorkLog } from './types.js';

export interface WorkLogRepository extends Repository<WorkLog, WorkLogId> {
  findAll(organizationId: OrganizationId): Promise<readonly WorkLog[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly WorkLog[]>;
  findByTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<readonly WorkLog[]>;
  findByAssignee(organizationId: OrganizationId, assigneeId: string): Promise<readonly WorkLog[]>;
}
