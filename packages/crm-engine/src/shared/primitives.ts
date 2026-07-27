/**
 * Cross-cutting primitives for the CRM Engine.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { CurrencyCode, Email, Phone } from '@lateen-os/shared-kernel/common';
import type { OrganizationId } from './identifiers.js';

export type { Email, Phone, CurrencyCode };

/** Audit timestamps present on all CRM aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — every CRM aggregate belongs to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** Free-form tag for discovery and classification. */
export type CrmTag = string;

/** ISO 8601 date-time string. */
export type ISODateTime = string;
