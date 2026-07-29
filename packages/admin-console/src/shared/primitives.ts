/**
 * Cross-cutting primitives for the Admin Console.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { OrganizationId } from './identifiers.js';

/** Audit timestamps present on all Admin Console aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — every Admin Console aggregate belongs to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** ISO 8601 date-time string. */
export type ISODateTime = string;

/** ISO 8601 calendar date string (`YYYY-MM-DD`). */
export type ISODate = string;
