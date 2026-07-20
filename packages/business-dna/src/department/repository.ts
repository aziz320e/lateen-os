/** @module department/repository */
import type { DepartmentId, OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Department } from './types.js';

export interface DepartmentRepository extends Repository<Department, DepartmentId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Department | null>;
  findByOrganization(organizationId: OrganizationId): Promise<readonly Department[]>;
}
