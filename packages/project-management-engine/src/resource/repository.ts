/** @module resource/repository */
import type { ProjectId } from '../project/types.js';
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, ResourceAssignmentId } from '../shared/identifiers.js';
import type { ProjectTaskId } from '../task/types.js';
import type { ResourceAssignment } from './types.js';

export interface ResourceAssignmentRepository extends Repository<ResourceAssignment, ResourceAssignmentId> {
  findAll(organizationId: OrganizationId): Promise<readonly ResourceAssignment[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly ResourceAssignment[]>;
  findByTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<readonly ResourceAssignment[]>;
  findByAssignee(organizationId: OrganizationId, assigneeId: string): Promise<readonly ResourceAssignment[]>;
}
