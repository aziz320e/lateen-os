/**
 * Cross-cutting primitives for the Capability Engine.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { OrganizationId } from './identifiers.js';

/** Human-readable code unique within an organization. */
export type CapabilityCode = string;

/** Audit timestamps on Capability Engine entities. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — all Capability Engine entities belong to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}
