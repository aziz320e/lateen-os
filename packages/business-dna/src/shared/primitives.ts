/**
 * Primitive value types and cross-cutting value object interfaces.
 *
 * Business-specific primitives remain here; shared value objects are sourced
 * from `@lateen-os/shared-kernel` and re-exported for backward compatibility.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { Address, CurrencyCode, Money } from '@lateen-os/shared-kernel/common';
import type { Timestamp } from '@lateen-os/shared-kernel/time';
import type { OrganizationId } from './identifiers.js';

export type { Money, Address, CurrencyCode };

/** ISO 8601 date-time string (UTC). Alias of shared-kernel {@link Timestamp}. */
export type ISODateTime = Timestamp;

/** ISO 8601 calendar date string (YYYY-MM-DD). */
export type ISODate = string;

/** BCP 47 locale tag (e.g. ar-SA, en-SA). */
export type LocaleCode = string;

/** IANA timezone identifier (e.g. Asia/Riyadh). */
export type Timezone = string;

/** Human-readable business code unique within an organization scope. */
export type BusinessCode = string;

/** Document number unique within an organization scope. */
export type DocumentNumber = string;

/** Audit timestamps present on all Business DNA aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — every aggregate except Organization belongs to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}
