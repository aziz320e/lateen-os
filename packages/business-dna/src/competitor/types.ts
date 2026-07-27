/** @module competitor/types */
import type { Entity } from '../shared/entity.js';
import type { CompetitorId, OrganizationId } from '../shared/identifiers.js';
import type { Auditable, TenantScoped } from '../shared/primitives.js';

export type { CompetitorId };

export type CompetitorStatus = 'active' | 'archived';

/** A tracked market competitor. */
export interface Competitor extends Entity<CompetitorId>, TenantScoped, Auditable {
  readonly name: string;
  readonly website?: string;
  readonly status: CompetitorStatus;
  readonly strengths: readonly string[];
  readonly weaknesses: readonly string[];
  /** Relative price positioning as a decimal multiplier of our own pricing (e.g. "1.10" = 10% pricier). */
  readonly priceIndex?: string;
  readonly marketShareEstimatePct?: string;
  readonly notes?: string;
}

export type { OrganizationId };
