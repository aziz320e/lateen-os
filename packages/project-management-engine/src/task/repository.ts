/** @module task/repository */
import type { ProjectId } from '../project/types.js';
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, ProjectTaskId } from '../shared/identifiers.js';
import type { ProjectTask, TaskPriority, TaskStatus } from './types.js';

export interface ProjectTaskRepository extends Repository<ProjectTask, ProjectTaskId> {
  findAll(organizationId: OrganizationId): Promise<readonly ProjectTask[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly ProjectTask[]>;
  findByParent(organizationId: OrganizationId, parentTaskId: ProjectTaskId): Promise<readonly ProjectTask[]>;
  findByStatus(organizationId: OrganizationId, status: TaskStatus): Promise<readonly ProjectTask[]>;
  findByPriority(organizationId: OrganizationId, priority: TaskPriority): Promise<readonly ProjectTask[]>;
  findByLabel(organizationId: OrganizationId, label: string): Promise<readonly ProjectTask[]>;
}
