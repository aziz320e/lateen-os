/** @module ranking/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, RankingResultId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { RankingResultId };

export type RankingStrategy =
  | 'score_desc'
  | 'demand_desc'
  | 'profit_desc'
  | 'roi_desc'
  | 'risk_asc'
  | 'composite'
  | 'custom';

export interface RankedItem {
  readonly subjectType: string;
  readonly subjectId: string;
  readonly rank: number;
  readonly score: ScoreValue;
}

/** Result of ranking intelligence subjects. */
export interface RankingResult extends TenantAuditableEntity<RankingResultId> {
  readonly strategy: RankingStrategy;
  readonly subjectType: string;
  readonly items: readonly RankedItem[];
}

export type { OrganizationId };
