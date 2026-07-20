/** @module role/repository */
import type { OrganizationId, RoleId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Role, RoleStatus, RoleType } from './types.js';

export interface RoleRepository extends Repository<Role, RoleId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Role | null>;
  findByType(organizationId: OrganizationId, type: RoleType): Promise<readonly Role[]>;
  findByStatus(organizationId: OrganizationId, status: RoleStatus): Promise<readonly Role[]>;
}
