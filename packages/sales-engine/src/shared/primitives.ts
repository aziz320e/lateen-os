/**
 * Cross-cutting primitives for the Sales Engine.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { CurrencyCode } from '@lateen-os/shared-kernel/common';
import type { OrganizationId } from './identifiers.js';

export type { CurrencyCode };

/** Audit timestamps present on all Sales Engine aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — every Sales Engine aggregate belongs to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** Free-form tag for discovery and classification. */
export type SalesTag = string;

/** ISO 8601 date-time string. */
export type ISODateTime = string;

/** Decimal amount represented as a string for deterministic arithmetic. */
export type DecimalAmount = string;
