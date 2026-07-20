/** @module shared/primitives */
export type { OrganizationId } from '@lateen-os/business-dna';

/** Tenant scope for brain entities. */
export interface TenantScoped {
  readonly organizationId: import('@lateen-os/business-dna').OrganizationId;
}

/** Audit metadata for brain entities. */
export interface Auditable {
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly createdBy?: string;
  readonly updatedBy?: string;
}

/** Normalized score in the range 0–1 as a decimal string. */
export type ScoreValue = string;

/** Correlation identifier for tracing reasoning sessions. */
export type CorrelationId = string;
