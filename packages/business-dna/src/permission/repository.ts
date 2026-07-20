/** @module permission/repository */
import type { OrganizationId, PermissionId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { BusinessCode } from '../shared/primitives.js';
import type { Permission, PermissionAction, PermissionStatus } from './types.js';

export interface PermissionRepository extends Repository<Permission, PermissionId> {
  findByCode(organizationId: OrganizationId, code: BusinessCode): Promise<Permission | null>;
  findByResource(
    organizationId: OrganizationId,
    resource: string,
  ): Promise<readonly Permission[]>;
  findByAction(
    organizationId: OrganizationId,
    action: PermissionAction,
  ): Promise<readonly Permission[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: PermissionStatus,
  ): Promise<readonly Permission[]>;
}
