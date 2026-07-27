/**
 * Cross-cutting primitives for the Marketing Engine.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { CurrencyCode } from '@lateen-os/shared-kernel/common';
import type { OrganizationId } from './identifiers.js';

export type { CurrencyCode };

/** Audit timestamps present on all Marketing Engine aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — every Marketing Engine aggregate belongs to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** Free-form tag for discovery and classification. */
export type MarketingTag = string;

/** ISO 8601 date-time string. */
export type ISODateTime = string;
