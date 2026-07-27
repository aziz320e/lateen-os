/** @module tool-security/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ToolPolicyId } from '../shared/identifiers.js';

export type { ToolPolicyId };

export type ToolPolicyStatus = 'active' | 'archived';

/** A deterministic tool execution policy — allow list, deny list (deny always wins), and per-identity tool permissions. */
export interface ToolPolicy extends TenantAuditableEntity<ToolPolicyId> {
  readonly name: string;
  readonly status: ToolPolicyStatus;
  readonly allowedToolIds: readonly string[];
  readonly deniedToolIds: readonly string[];
}

export interface ToolExecutionEvaluation {
  readonly allowed: boolean;
  readonly reason?: string;
}

export type { OrganizationId } from '../shared/identifiers.js';
