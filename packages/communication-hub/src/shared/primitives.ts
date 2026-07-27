/**
 * Cross-cutting primitives for the Communication Hub.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { OrganizationId } from './identifiers.js';

/** Audit timestamps present on all Communication Hub aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — every Communication Hub aggregate belongs to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** Free-form tag for discovery and classification. */
export type CommunicationTag = string;

/** ISO 8601 date-time string. */
export type ISODateTime = string;
