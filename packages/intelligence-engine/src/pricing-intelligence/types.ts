/** @module pricing-intelligence/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { OrganizationId, PriceAnalysisId, ProductId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';

export type { PriceAnalysisId };

export type PriceAnalysisStatus = 'draft' | 'active' | 'archived';

export interface MarginAnalysis {
  readonly currentMargin: ScoreValue;
  readonly targetMargin: ScoreValue;
  readonly gap: ScoreValue;
}

export interface CompetitivePrice {
  readonly competitorName: string;
  readonly price: ScoreValue;
  readonly currency: string;
}

export interface TargetPrice {
  readonly recommended: ScoreValue;
  readonly floor: ScoreValue;
  readonly ceiling: ScoreValue;
  readonly currency: string;
}

/** Pricing intelligence analysis for a product or category. */
export interface PriceAnalysis extends TenantAuditableEntity<PriceAnalysisId> {
  readonly productId?: ProductId;
  readonly category?: string;
  readonly marginAnalysis: MarginAnalysis;
  readonly competitivePrices: readonly CompetitivePrice[];
  readonly targetPrice: TargetPrice;
  readonly priceGap?: ScoreValue;
  readonly status: PriceAnalysisStatus;
}

export type { OrganizationId };
