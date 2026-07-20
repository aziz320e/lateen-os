/** @module capability/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CapabilityId, OrganizationId } from '../shared/identifiers.js';
import type { CapabilityCode } from '../shared/primitives.js';

export type { CapabilityId };

/** Production capability category — what kind of work the organization can perform. */
export type CapabilityCategory =
  | 'printing'
  | 'cutting'
  | 'engraving'
  | 'finishing'
  | 'bending'
  | 'assembly'
  | 'packaging'
  | 'installation'
  | 'shipping'
  | 'design';

export type CapabilityStatus = 'draft' | 'active' | 'inactive' | 'archived';

/**
 * Capability aggregate root — models what the company is capable of doing,
 * independent of any specific machine, product, or service.
 */
export interface Capability extends TenantAuditableEntity<CapabilityId> {
  readonly code: CapabilityCode;
  readonly name: string;
  readonly description?: string;
  readonly category: CapabilityCategory;
  readonly status: CapabilityStatus;
  readonly tags: readonly string[];
  readonly version: number;
}

export type { OrganizationId };
