/**
 * Cross-cutting primitives for the Marketplace.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';

/** Audit timestamps present on all Marketplace aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** ISO 8601 date-time string. */
export type ISODateTime = string;
