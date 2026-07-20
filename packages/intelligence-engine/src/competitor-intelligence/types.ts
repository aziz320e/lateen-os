/** @module competitor-intelligence/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CompetitorId, OrganizationId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { CompetitorId };

export type CompetitorStatus = 'active' | 'monitoring' | 'archived';

export interface CompetitorProduct {
  readonly name: string;
  readonly category?: string;
  readonly description?: string;
}

export interface CompetitorPrice {
  readonly productName: string;
  readonly price: ScoreValue;
  readonly currency: string;
  readonly observedAt: string;
}

export interface CompetitorCapability {
  readonly name: string;
  readonly description?: string;
  readonly threatLevel?: ScoreValue;
}

/** Tracked competitor profile and intelligence. */
export interface Competitor extends TenantAuditableEntity<CompetitorId> {
  readonly name: string;
  readonly region?: string;
  readonly products: readonly CompetitorProduct[];
  readonly prices: readonly CompetitorPrice[];
  readonly capabilities: readonly CompetitorCapability[];
  readonly threatScore?: ScoreValue;
  readonly status: CompetitorStatus;
}

export type { OrganizationId };
