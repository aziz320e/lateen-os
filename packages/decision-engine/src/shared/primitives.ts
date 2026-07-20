/**
 * Cross-cutting primitives for the Decision Engine.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { OrganizationId } from './identifiers.js';

/** Audit timestamps on decision aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — all decision entities belong to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** Actor that initiated a decision request (human or AI agent — request only, not decision). */
export type DecisionRequesterType = 'employee' | 'ai_agent' | 'system';
