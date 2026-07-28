/** @module material/repository */
import type { ProjectId } from '../project/types.js';
import type { Repository } from '../shared/repository.js';
import type { MaterialRequirementId, OrganizationId } from '../shared/identifiers.js';
import type { ProjectTaskId } from '../task/types.js';
import type { MaterialRequirement } from './types.js';

export interface MaterialRequirementRepository extends Repository<MaterialRequirement, MaterialRequirementId> {
  findAll(organizationId: OrganizationId): Promise<readonly MaterialRequirement[]>;
  findByProject(organizationId: OrganizationId, projectId: ProjectId): Promise<readonly MaterialRequirement[]>;
  findByTask(organizationId: OrganizationId, taskId: ProjectTaskId): Promise<readonly MaterialRequirement[]>;
  findByItem(organizationId: OrganizationId, itemId: string): Promise<readonly MaterialRequirement[]>;
}
