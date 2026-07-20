/**
 * Cross-cutting primitives for Institutional Memory.
 *
 * @module shared/primitives
 */

import type { AuditInfo } from '@lateen-os/shared-kernel/audit';
import type { OrganizationId } from './identifiers.js';

/** Audit timestamps on memory aggregates. */
export type Auditable = Pick<AuditInfo, 'createdAt' | 'updatedAt'>;

/** Tenant scope — all memory entities belong to one organization. */
export interface TenantScoped {
  readonly organizationId: OrganizationId;
}

/** Free-form tag for discovery and classification. */
export type MemoryTag = string;

/** Provenance label describing where memory originated (not chat logs). */
export type MemorySourceLabel = string;
