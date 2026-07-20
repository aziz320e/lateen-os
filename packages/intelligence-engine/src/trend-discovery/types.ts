/** @module trend-discovery/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, TrendId, TrendSignalId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { TrendId };

export type TrendCategory =
  | 'product_demand'
  | 'capability_demand'
  | 'market_shift'
  | 'seasonal'
  | 'technology'
  | 'regulatory'
  | 'customer_behavior'
  | 'pricing';

export type TrendSource =
  | 'sales_data'
  | 'market_research'
  | 'competitor_intel'
  | 'customer_feedback'
  | 'kpi_metrics'
  | 'institutional_memory'
  | 'external_feed';

export type TrendStatus = 'emerging' | 'active' | 'peaking' | 'declining' | 'archived';

export interface TrendScore {
  readonly value: ScoreValue;
  readonly direction: 'rising' | 'stable' | 'declining';
  readonly computedAt: Timestamp;
}

export interface TrendSignal {
  readonly signalId: TrendSignalId;
  readonly description: string;
  readonly source: TrendSource;
  readonly strength: ScoreValue;
  readonly observedAt: Timestamp;
}

/** Discovered trend in products, capabilities, or markets. */
export interface Trend extends TenantAuditableEntity<TrendId> {
  readonly title: string;
  readonly description?: string;
  readonly category: TrendCategory;
  readonly score: TrendScore;
  readonly source: TrendSource;
  readonly signals: readonly TrendSignal[];
  readonly status: TrendStatus;
}

export type { OrganizationId };
