/** @module authorization/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { PolicyId, RoleId } from '../shared/identifiers.js';

export type { PolicyId, RoleId };

export type RoleStatus = 'active' | 'archived';

/** A named bundle of permissions, optionally inheriting from a parent role. */
export interface Role extends TenantAuditableEntity<RoleId> {
  readonly name: string;
  readonly permissions: readonly string[];
  readonly parentRoleId?: RoleId;
  readonly status: RoleStatus;
}

export type PolicyType = 'rbac' | 'abac' | 'custom';
export type PolicyEffect = 'allow' | 'deny';
export type PolicyStatus = 'active' | 'archived';
export type AttributeOperator = 'eq' | 'neq' | 'in';

export type PolicyRule =
  | { readonly type: 'role'; readonly roleId: RoleId }
  | { readonly type: 'permission'; readonly permission: string }
  | { readonly type: 'attribute'; readonly attribute: string; readonly operator: AttributeOperator; readonly value: string | readonly string[] };

/** A deterministic RBAC, ABAC, or custom authorization policy. Every rule must match (AND semantics). */
export interface Policy extends TenantAuditableEntity<PolicyId> {
  readonly name: string;
  readonly policyType: PolicyType;
  readonly effect: PolicyEffect;
  readonly rules: readonly PolicyRule[];
  readonly status: PolicyStatus;
}

export interface AuthorizeRequest {
  readonly identityId: string;
  readonly permission: string;
  /** The organization the resource being accessed actually belongs to — checked against the caller's `organizationId` for tenant isolation. */
  readonly resourceOrganizationId: string;
  readonly attributes?: Readonly<Record<string, string>>;
}

export interface AuthorizeResult {
  readonly allowed: boolean;
  readonly reason?: string;
}

export type { OrganizationId } from '../shared/identifiers.js';
