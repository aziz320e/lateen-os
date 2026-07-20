/** @module opportunities/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { BusinessOpportunityId, OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { BusinessOpportunityId };

export type OpportunityCategory =
  | 'growth'
  | 'efficiency'
  | 'innovation'
  | 'market_expansion'
  | 'cost_reduction'
  | 'customer_retention'
  | 'capability_gap'
  | 'pricing';

export type BusinessOpportunityStatus =
  | 'identified'
  | 'qualified'
  | 'pursuing'
  | 'won'
  | 'lost'
  | 'archived';

export interface OpportunityScore {
  readonly value: ScoreValue;
  readonly confidence: ScoreValue;
  readonly urgency?: ScoreValue;
}

/** Qualified business opportunity discovered by intelligence. */
export interface BusinessOpportunity extends TenantAuditableEntity<BusinessOpportunityId> {
  readonly title: string;
  readonly description: string;
  readonly category: OpportunityCategory;
  readonly score: OpportunityScore;
  readonly estimatedValue?: ScoreValue;
  readonly status: BusinessOpportunityStatus;
}

export type { OrganizationId };
