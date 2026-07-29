/** @module organizations/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId } from '../shared/identifiers.js';

export type { OrganizationId };

export type OrganizationPlan = 'free' | 'starter' | 'business' | 'enterprise';
export type OrganizationStatus = 'active' | 'suspended' | 'archived';

/**
 * Platform-level administrative record for one organization — the
 * tenancy boundary itself. Deliberately keyed 1:1 with `OrganizationId`
 * (`id === organizationId`): Admin Console administers organizations,
 * it does not redefine the canonical `OrganizationId` namespace owned
 * by Business DNA.
 */
export interface Organization extends TenantAuditableEntity<OrganizationId> {
  readonly name: string;
  readonly plan: OrganizationPlan;
  readonly status: OrganizationStatus;
}
