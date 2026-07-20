/** @module customer-insights/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CustomerId, CustomerInsightId, OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { CustomerInsightId };

export type CustomerInsightStatus = 'active' | 'archived';

export interface CustomerSegment {
  readonly code: string;
  readonly name: string;
  readonly description?: string;
  readonly size?: number;
}

export interface BuyingPattern {
  readonly pattern: string;
  readonly frequency?: string;
  readonly averageOrderValue?: ScoreValue;
  readonly seasonality?: readonly string[];
}

/** Intelligence insight about a customer or segment. */
export interface CustomerInsight extends TenantAuditableEntity<CustomerInsightId> {
  readonly title: string;
  readonly summary: string;
  readonly customerId?: CustomerId;
  readonly segment?: CustomerSegment;
  readonly buyingPattern?: BuyingPattern;
  readonly confidence: ScoreValue;
  readonly status: CustomerInsightStatus;
}

export type { OrganizationId };
