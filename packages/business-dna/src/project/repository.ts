/** @module project/repository */
import type { CustomerId, OrganizationId, ProjectId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Project, ProjectStatus, ProjectType } from './types.js';

export interface ProjectRepository extends Repository<Project, ProjectId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Project | null>;
  findByCustomer(
    organizationId: OrganizationId,
    customerId: CustomerId,
  ): Promise<readonly Project[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: ProjectStatus,
  ): Promise<readonly Project[]>;
  findByType(
    organizationId: OrganizationId,
    projectType: ProjectType,
  ): Promise<readonly Project[]>;
}
