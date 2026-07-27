/** @module audience/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AudienceId, CustomerId } from '../shared/identifiers.js';
import type { MarketingTag } from '../shared/primitives.js';

export type { AudienceId };

export type AudienceType = 'static' | 'dynamic';

export type AudienceStatus = 'active' | 'archived';

export type AudienceFilterField = 'name' | 'email' | 'company' | 'tag';
export type AudienceFilterOperator = 'eq' | 'contains';

/** One deterministic segmentation criterion — every filter on an audience must match (AND semantics). */
export interface AudienceFilter {
  readonly field: AudienceFilterField;
  readonly operator: AudienceFilterOperator;
  readonly value: string;
}

/** Minimal structural shape a dynamic filter can be evaluated against — satisfied by a real CRM Engine `Customer`. */
export interface AudienceFilterCandidate {
  readonly name: string;
  readonly email?: string;
  readonly company?: string;
  readonly tags: readonly string[];
}

/** A named, reusable marketing audience — a fixed member list or a deterministic dynamic segment. */
export interface Audience extends TenantAuditableEntity<AudienceId> {
  readonly name: string;
  readonly audienceType: AudienceType;
  readonly status: AudienceStatus;
  /** Used when `audienceType === 'static'`. */
  readonly staticMemberIds?: readonly CustomerId[];
  /** Used when `audienceType === 'dynamic'` — evaluated against CRM Engine customers at resolve time. */
  readonly filters?: readonly AudienceFilter[];
}

export type { OrganizationId } from '../shared/identifiers.js';
