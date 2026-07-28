/** @module expansion/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ExpansionOpportunityId } from '../shared/identifiers.js';
import type { CurrencyCode } from '../shared/primitives.js';

export type { ExpansionOpportunityId };

export type ExpansionOpportunityType = 'upsell' | 'cross_sell';

export type ExpansionOpportunityStatus = 'identified' | 'proposed' | 'won' | 'lost';

/** An upsell or cross-sell opportunity identified for an existing customer. */
export interface ExpansionOpportunity extends TenantAuditableEntity<ExpansionOpportunityId> {
  readonly customerId: string;
  readonly opportunityType: ExpansionOpportunityType;
  readonly description?: string;
  readonly estimatedValue?: string;
  readonly currency?: CurrencyCode;
  readonly status: ExpansionOpportunityStatus;
  /** Opaque foreign key — a real Sales Engine `SalesOpportunityId`, resolved via the Relationship Layer. */
  readonly linkedSalesOpportunityId?: string;
}
