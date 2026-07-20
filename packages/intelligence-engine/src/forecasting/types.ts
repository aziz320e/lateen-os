/** @module forecasting/types */
import type { ConfidenceScore } from '@lateen-os/institutional-memory';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ForecastId, OrganizationId, ProductId } from '../shared/identifiers.js';
import type { ScoreValue } from '../shared/primitives.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { ForecastId };

export type ForecastModel =
  | 'moving_average'
  | 'exponential_smoothing'
  | 'seasonal_decomposition'
  | 'regression'
  | 'ensemble'
  | 'custom';

export type ForecastPeriod = '7d' | '30d' | '90d' | '180d' | '365d';

export interface ForecastConfidence {
  readonly score: ConfidenceScore;
  readonly lowerBound?: ScoreValue;
  readonly upperBound?: ScoreValue;
}

export type ForecastStatus = 'draft' | 'published' | 'superseded' | 'archived';

/** Demand or metric forecast. */
export interface Forecast extends TenantAuditableEntity<ForecastId> {
  readonly subjectType: 'product' | 'capability' | 'market' | 'kpi';
  readonly subjectId?: string;
  readonly productId?: ProductId;
  readonly model: ForecastModel;
  readonly period: ForecastPeriod;
  readonly predictedValue: ScoreValue;
  readonly confidence: ForecastConfidence;
  readonly forecastFrom: Timestamp;
  readonly forecastTo: Timestamp;
  readonly status: ForecastStatus;
}

export type { OrganizationId };
