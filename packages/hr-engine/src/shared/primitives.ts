/**
 * Cross-cutting primitives for the HR Engine.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { CurrencyCode, Money } from '@lateen-os/shared-kernel/common';
import type { OrganizationId } from './identifiers.js';

export type { CurrencyCode, Money };

/** Audit timestamps present on all HR Engine aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — every HR Engine aggregate belongs to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** ISO 8601 date-time string. */
export type ISODateTime = string;

/** ISO 8601 calendar date string (`YYYY-MM-DD`). */
export type ISODate = string;
