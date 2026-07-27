/**
 * Real Sales Forecast engine — deterministic weighted pipeline, stage
 * probability, expected revenue, and monthly forecast. No AI/LLM: every
 * figure is a pure arithmetic reduction over the open sales pipeline.
 *
 * @module forecast/engine.impl
 */
import type { SalesEventBus } from '../events/sales-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { SalesOpportunityRepository } from '../opportunity/repository.js';
import type { SalesPipelineStage } from '../opportunity/types.js';
import type { ForecastSnapshotRepository } from './repository.js';
import type { ForecastSnapshot, MonthlyForecastBucket } from './types.js';

/** Deterministic win-probability assigned to each pipeline stage. No AI model — a fixed lookup table. */
export const STAGE_PROBABILITY: Readonly<Record<SalesPipelineStage, number>> = {
  new: 0.1,
  discovery: 0.2,
  qualified: 0.35,
  proposal: 0.5,
  negotiation: 0.65,
  verbal_commit: 0.85,
  won: 1,
  lost: 0,
};

export function probabilityForStage(stage: SalesPipelineStage): number {
  return STAGE_PROBABILITY[stage];
}

function parseDecimal(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoney(value: number): string {
  return value.toFixed(2);
}

/** Pure: an opportunity's amount weighted by its stage's win probability. */
export function computeWeightedAmount(amount: string | undefined, stage: SalesPipelineStage): string {
  return toMoney(parseDecimal(amount) * probabilityForStage(stage));
}

const UNSCHEDULED_BUCKET = 'unscheduled';

export interface ForecastEngine {
  /** Recomputes and persists a new forecast snapshot from the current open pipeline. */
  generateForecast(organizationId: OrganizationId): Promise<ForecastSnapshot>;
  getLatestForecast(organizationId: OrganizationId): Promise<ForecastSnapshot | null>;
  /** Every snapshot for an organization, most recently generated first. */
  listForecasts(organizationId: OrganizationId): Promise<readonly ForecastSnapshot[]>;
}

/** Creates a real {@link ForecastEngine} over the Sales Opportunity and Forecast Snapshot repositories. */
export function createForecastEngine(
  opportunityRepository: SalesOpportunityRepository,
  forecastRepository: ForecastSnapshotRepository,
  eventBus?: SalesEventBus,
  now: () => string = nowIso,
): ForecastEngine {
  return {
    async generateForecast(organizationId) {
      const opportunities = (await opportunityRepository.findAll(organizationId)).filter(
        (opportunity) => opportunity.status === 'active' && opportunity.stage !== 'won' && opportunity.stage !== 'lost',
      );

      const buckets = new Map<string, { totalAmount: number; weightedAmount: number; count: number }>();
      let totalOpenAmount = 0;
      let weightedPipelineValue = 0;

      for (const opportunity of opportunities) {
        const amount = parseDecimal(opportunity.amount);
        const weighted = amount * probabilityForStage(opportunity.stage);
        totalOpenAmount += amount;
        weightedPipelineValue += weighted;

        const month = opportunity.expectedCloseDate ? opportunity.expectedCloseDate.slice(0, 7) : UNSCHEDULED_BUCKET;
        const bucket = buckets.get(month) ?? { totalAmount: 0, weightedAmount: 0, count: 0 };
        bucket.totalAmount += amount;
        bucket.weightedAmount += weighted;
        bucket.count += 1;
        buckets.set(month, bucket);
      }

      const monthlyForecast: MonthlyForecastBucket[] = [...buckets.entries()]
        .sort(([monthA], [monthB]) => {
          if (monthA === UNSCHEDULED_BUCKET) return 1;
          if (monthB === UNSCHEDULED_BUCKET) return -1;
          return monthA < monthB ? -1 : monthA > monthB ? 1 : 0;
        })
        .map(([month, bucket]) => ({
          month,
          totalAmount: toMoney(bucket.totalAmount),
          weightedAmount: toMoney(bucket.weightedAmount),
          opportunityCount: bucket.count,
        }));

      const snapshot: ForecastSnapshot = {
        id: generateId('forecast'),
        organizationId,
        generatedAt: now(),
        totalOpenAmount: toMoney(totalOpenAmount),
        weightedPipelineValue: toMoney(weightedPipelineValue),
        opportunityCount: opportunities.length,
        monthlyForecast,
      };
      await forecastRepository.save(snapshot);
      eventBus?.publish('forecast.updated', {
        forecastId: snapshot.id,
        organizationId,
        weightedPipelineValue: snapshot.weightedPipelineValue,
      });
      return snapshot;
    },

    async getLatestForecast(organizationId) {
      return forecastRepository.findLatest(organizationId);
    },

    async listForecasts(organizationId) {
      return forecastRepository.findAll(organizationId);
    },
  };
}
