/** @module permission/types */
import type { Entity } from '../shared/entity.js';
import type {
  OrganizationId,
  PermissionId,
  PolicyId,
} from '../shared/identifiers.js';
import type { Auditable, BusinessCode, TenantScoped } from '../shared/primitives.js';

export type { PermissionId };

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'approve'
  | 'execute';

export type PermissionScope =
  | 'organization'
  | 'branch'
  | 'department'
  | 'own'
  | 'entity';

export type PermissionStatus = 'draft' | 'active' | 'inactive' | 'archived';

/** Granular access rule — atomic unit of authorization evaluated by Core. */
export interface Permission extends Entity<PermissionId>, TenantScoped, Auditable {
  readonly code: BusinessCode;
  readonly name: string;
  readonly description?: string;
  readonly resource: string;
  readonly action: PermissionAction;
  readonly scope: PermissionScope;
  readonly status: PermissionStatus;
  readonly policyId?: PolicyId;
}

export type { OrganizationId, PolicyId };
