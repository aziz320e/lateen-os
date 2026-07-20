/** @module market-research/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { MarketId, MarketSegmentId, OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { MarketId, MarketSegmentId };

export type MarketStatus = 'active' | 'monitoring' | 'archived';

export interface Demand {
  readonly volume: ScoreValue;
  readonly growthRate?: ScoreValue;
  readonly periodLabel?: string;
}

export interface Supply {
  readonly capacity: ScoreValue;
  readonly utilization?: ScoreValue;
  readonly gap?: ScoreValue;
}

/** Market-level opportunity (distinct from BusinessOpportunity aggregate). */
export interface Opportunity {
  readonly code: string;
  readonly title: string;
  readonly description?: string;
  readonly estimatedValue?: ScoreValue;
}

export interface MarketSegment {
  readonly segmentId: MarketSegmentId;
  readonly name: string;
  readonly description?: string;
  readonly demand?: Demand;
}

/** Researched market with demand/supply analysis. */
export interface Market extends TenantAuditableEntity<MarketId> {
  readonly name: string;
  readonly region?: string;
  readonly segments: readonly MarketSegment[];
  readonly demand: Demand;
  readonly supply: Supply;
  readonly opportunities: readonly Opportunity[];
  readonly status: MarketStatus;
}

export type { OrganizationId };
