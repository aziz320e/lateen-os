/**
 * Cross-cutting primitives for the AI Security Engine.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { OrganizationId } from './identifiers.js';

/** Audit timestamps present on all AI Security Engine aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — every AI Security Engine aggregate belongs to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** ISO 8601 date-time string. */
export type ISODateTime = string;
