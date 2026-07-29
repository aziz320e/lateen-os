/** @module identity/repository */
import type { Repository } from '../shared/repository.js';
import type { GroupId, OrganizationId, PermissionId, RoleId, UserId } from '../shared/identifiers.js';
import type { Group, Permission, Role, User } from './types.js';

export interface PermissionRepository extends Repository<Permission, PermissionId> {
  findAll(organizationId: OrganizationId): Promise<readonly Permission[]>;
  findByCode(organizationId: OrganizationId, code: string): Promise<Permission | null>;
}

export interface RoleRepository extends Repository<Role, RoleId> {
  findAll(organizationId: OrganizationId): Promise<readonly Role[]>;
}

export interface GroupRepository extends Repository<Group, GroupId> {
  findAll(organizationId: OrganizationId): Promise<readonly Group[]>;
}

export interface UserRepository extends Repository<User, UserId> {
  findAll(organizationId: OrganizationId): Promise<readonly User[]>;
  findByEmail(organizationId: OrganizationId, email: string): Promise<User | null>;
}
