/** @module aggregation/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AggregationResultId } from '../shared/identifiers.js';

export type { AggregationResultId };

/** A single, deterministic aggregation run over a set of records. */
export interface AggregationResult extends TenantAuditableEntity<AggregationResultId> {
  /** A caller-supplied label describing what `groupFn` grouped by (e.g. `'stage'`, `'productId'`) — for display only. */
  readonly groupByKey: string;
  readonly groupTotals: Readonly<Record<string, number>>;
  readonly groupCounts: Readonly<Record<string, number>>;
  readonly computedAt: string;
}

/** A group-vs-group comparison entry produced by `compareGroups()`. */
export interface GroupComparison {
  readonly current: number;
  readonly previous: number;
  readonly changePercentage: number;
}

/** A recursive drill-down tree: an internal node keyed by group value, or a leaf array of records. */
export type DrillDownNode<T> = { readonly [key: string]: DrillDownNode<T> | readonly T[] };
