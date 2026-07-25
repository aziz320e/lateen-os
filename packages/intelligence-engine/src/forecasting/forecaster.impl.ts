/**
 * Real, deterministic forecasting — a moving-average projection for short
 * history and a least-squares linear-trend projection once enough points
 * are available. Deliberately statistical, never LLM-driven, matching this
 * package's "produces intelligence only" boundary.
 *
 * @module forecasting/forecaster.impl
 */
import { randomUUID } from 'node:crypto';
import type { OrganizationId, ProductId } from '../shared/identifiers.js';
import type { Forecast, ForecastModel, ForecastPeriod } from './types.js';

export interface HistoricalPoint {
  readonly timestamp: string;
  readonly value: number;
}

export interface ForecastInput {
  readonly organizationId: OrganizationId;
  readonly subjectType: 'product' | 'capability' | 'market' | 'kpi';
  readonly subjectId?: string;
  readonly productId?: ProductId;
  readonly period: ForecastPeriod;
  readonly history: readonly HistoricalPoint[];
  /** Forces a specific model instead of the automatic moving-average/regression choice. */
  readonly model?: ForecastModel;
}

const PERIOD_DAYS: Record<ForecastPeriod, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '180d': 180,
  '365d': 365,
};

function movingAverage(values: readonly number[], window: number): number {
  const slice = values.slice(-window);
  return slice.length ? slice.reduce((sum, value) => sum + value, 0) / slice.length : 0;
}

/** Least-squares linear regression over (index, value) pairs, projected one step past the last observation. */
function linearTrendProjection(history: readonly HistoricalPoint[]): number {
  const n = history.length;
  if (n === 0) return 0;
  if (n === 1) return history[0]!.value;

  const xs = history.map((_, index) => index);
  const ys = history.map((point) => point.value);
  const xMean = xs.reduce((sum, x) => sum + x, 0) / n;
  const yMean = ys.reduce((sum, y) => sum + y, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (xs[i]! - xMean) * (ys[i]! - yMean);
    denominator += (xs[i]! - xMean) ** 2;
  }
  const slope = denominator === 0 ? 0 : numerator / denominator;
  const intercept = yMean - slope * xMean;
  return intercept + slope * n;
}

export interface Forecaster {
  forecast(input: ForecastInput): Forecast;
}

/** Creates a {@link Forecaster} using moving-average (short history) or linear regression (4+ points). */
export function createForecaster(): Forecaster {
  return {
    forecast(input) {
      const values = input.history.map((point) => point.value);
      const model: ForecastModel = input.model ?? (values.length >= 4 ? 'regression' : 'moving_average');
      const predictedValue =
        model === 'regression' ? linearTrendProjection(input.history) : movingAverage(values, 3);

      // More history → higher confidence, capped at 0.9 (a forecast is never certain).
      const confidenceScore = Math.min(0.9, 0.3 + input.history.length * 0.1).toFixed(2);
      const spread = Math.abs(predictedValue) * (1 - parseFloat(confidenceScore));

      const now = new Date();
      const forecastFrom = now.toISOString();
      const forecastTo = new Date(now.getTime() + PERIOD_DAYS[input.period] * 24 * 60 * 60 * 1000).toISOString();

      return {
        id: randomUUID(),
        organizationId: input.organizationId,
        createdAt: forecastFrom,
        updatedAt: forecastFrom,
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        productId: input.productId,
        model,
        period: input.period,
        predictedValue: predictedValue.toFixed(4),
        confidence: {
          score: confidenceScore,
          lowerBound: (predictedValue - spread).toFixed(4),
          upperBound: (predictedValue + spread).toFixed(4),
        },
        forecastFrom,
        forecastTo,
        status: 'draft',
      };
    },
  };
}
