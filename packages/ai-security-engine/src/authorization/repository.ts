/** @module authorization/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, PolicyId, RoleId } from '../shared/identifiers.js';
import type { Policy, PolicyStatus, Role, RoleStatus } from './types.js';

export interface RoleRepository extends Repository<Role, RoleId> {
  findAll(organizationId: OrganizationId): Promise<readonly Role[]>;
  findByStatus(organizationId: OrganizationId, status: RoleStatus): Promise<readonly Role[]>;
}

export interface PolicyRepository extends Repository<Policy, PolicyId> {
  findAll(organizationId: OrganizationId): Promise<readonly Policy[]>;
  findByStatus(organizationId: OrganizationId, status: PolicyStatus): Promise<readonly Policy[]>;
}

/** Maps an identity to its directly-assigned roles. */
export interface RoleAssignmentRepository {
  assign(organizationId: OrganizationId, identityId: string, roleId: RoleId): Promise<void>;
  unassign(organizationId: OrganizationId, identityId: string, roleId: RoleId): Promise<void>;
  findRoleIds(organizationId: OrganizationId, identityId: string): Promise<readonly RoleId[]>;
}
