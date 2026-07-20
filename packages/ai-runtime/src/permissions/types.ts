/** @module permissions/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  CapabilityId,
  OrganizationId,
  PermissionId,
  RuntimeAgentId,
} from '../shared/identifiers.js';

/** Runtime-level permission scope. */
export interface RuntimePermission {
  readonly permissionId: PermissionId;
  readonly code: string;
  readonly description?: string;
}

/** Permissions granted to a runtime agent (one record per agent). */
export interface AgentPermission extends TenantAuditableEntity<RuntimeAgentId> {
  readonly permissions: readonly RuntimePermission[];
}

/** Capability-scoped permission binding. */
export interface CapabilityPermission {
  readonly capabilityId: CapabilityId;
  readonly permissionId: PermissionId;
  readonly allowed: boolean;
}

export type { OrganizationId };
