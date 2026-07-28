/** @module deliverable/repository */
import type { ProjectId } from '../project/types.js';
import type { Repository } from '../shared/repository.js';
import type { DeliverableId, OrganizationId } from '../shared/identifiers.js';
import type { ProjectTaskId } from '../task/types.js';
import type { Deliverable, DeliverableStatus } from './types.js';

export interface DeliverableRepository extends Repository<Deliverable, DeliverableId> {
  findAll(organizationId: OrganizationId): Promise<readonly Deliverable[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly Deliverable[]>;
  findByTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<readonly Deliverable[]>;
  findByStatus(organizationId: OrganizationId, status: DeliverableStatus): Promise<readonly Deliverable[]>;
}
