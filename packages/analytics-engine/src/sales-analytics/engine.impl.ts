/**
 * Real Sales Analytics engine — pipeline value, conversion funnel,
 * stage duration, close rate, and sales velocity. Composes the real,
 * optional Sales Engine query port (never a repository).
 *
 * @module sales-analytics/engine.impl
 */
import type { SalesRuntime } from '@lateen-os/sales-engine';
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, SalesAnalyticsId } from '../shared/identifiers.js';
import type { SalesAnalyticsRepository } from './repository.js';
import type { SalesAnalyticsSnapshot } from './types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseAmount(amount?: string): number {
  return amount ? Number(amount) : 0;
}

function daysBetween(start: string, end: string): number {
  return (new Date(end).getTime() - new Date(start).getTime()) / (24 * 60 * 60 * 1000);
}

/** Pure: close rate as a percentage of closed (won + lost) deals that were won. */
export function computeCloseRate(wonCount: number, lostCount: number): number {
  const closed = wonCount + lostCount;
  return closed === 0 ? 0 : round2((wonCount / closed) * 100);
}

/** Pure: classic sales velocity formula — `(dealCount × averageDealSize × winRate) / averageSalesCycleDays`. */
export function computeSalesVelocity(dealCount: number, averageDealSize: number, winRatePercent: number, averageSalesCycleDays: number): number {
  if (averageSalesCycleDays === 0) return 0;
  return round2((dealCount * averageDealSize * (winRatePercent / 100)) / averageSalesCycleDays);
}

/** Pure: average number of days each open opportunity has spent in its current stage so far. */
export function computeAverageStageDurationDays(
  opportunitiesByStage: Readonly<Record<string, readonly { readonly updatedAt: string }[]>>,
  asOf: string,
): Readonly<Record<string, number>> {
  const result: Record<string, number> = {};
  for (const [stage, opportunities] of Object.entries(opportunitiesByStage)) {
    if (opportunities.length === 0) continue;
    const totalDays = opportunities.reduce((sum, opportunity) => sum + daysBetween(opportunity.updatedAt, asOf), 0);
    result[stage] = round2(totalDays / opportunities.length);
  }
  return result;
}

export interface SalesAnalyticsDeps {
  readonly sales?: Pick<SalesRuntime, 'queries'>;
}

export interface ComputeSalesSnapshotInput {
  readonly asOf?: string;
}

export interface SalesAnalyticsEngine {
  computeSnapshot(organizationId: OrganizationId, input?: ComputeSalesSnapshotInput): Promise<SalesAnalyticsSnapshot>;
  get(organizationId: OrganizationId, snapshotId: SalesAnalyticsId): Promise<SalesAnalyticsSnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly SalesAnalyticsSnapshot[]>;
}

/** Creates a real {@link SalesAnalyticsEngine} over the optional Sales Engine collaborator. */
export function createSalesAnalyticsEngine(
  repository: SalesAnalyticsRepository,
  deps: SalesAnalyticsDeps = {},
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): SalesAnalyticsEngine {
  return {
    async computeSnapshot(organizationId, input) {
      const asOf = input?.asOf ?? now();

      let pipelineValue = 0;
      let funnel: Record<string, number> = {};
      let averageStageDurationDays: Readonly<Record<string, number>> = {};
      let closeRate = 0;
      let averageDealSize = 0;
      let averageSalesCycleDays = 0;
      let salesVelocity = 0;

      if (deps.sales) {
        const { groupedByStage } = await deps.sales.queries.findPipeline({ organizationId });
        for (const [stage, opportunities] of Object.entries(groupedByStage)) {
          funnel[stage] = opportunities.length;
          if (stage !== 'won' && stage !== 'lost') {
            pipelineValue += opportunities.reduce((sum, opportunity) => sum + parseAmount(opportunity.amount), 0);
          }
        }
        pipelineValue = round2(pipelineValue);
        averageStageDurationDays = computeAverageStageDurationDays(groupedByStage, asOf);

        const wonOpportunities = groupedByStage.won ?? [];
        const lostOpportunities = groupedByStage.lost ?? [];
        closeRate = computeCloseRate(wonOpportunities.length, lostOpportunities.length);
        averageDealSize = wonOpportunities.length === 0 ? 0 : round2(wonOpportunities.reduce((sum, o) => sum + parseAmount(o.amount), 0) / wonOpportunities.length);
        const cycleDays = wonOpportunities.filter((o) => o.closedAt !== undefined).map((o) => daysBetween(o.createdAt, o.closedAt!));
        averageSalesCycleDays = cycleDays.length === 0 ? 0 : round2(cycleDays.reduce((sum, d) => sum + d, 0) / cycleDays.length);
        salesVelocity = computeSalesVelocity(wonOpportunities.length, averageDealSize, closeRate, averageSalesCycleDays);
      }

      const timestamp = now();
      const snapshot: SalesAnalyticsSnapshot = {
        id: generateId('sales-analytics'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        pipelineValue,
        funnel,
        averageStageDurationDays,
        closeRate,
        averageDealSize,
        averageSalesCycleDays,
        salesVelocity,
        computedAt: timestamp,
      };
      await repository.save(snapshot);
      eventBus?.publish('analytics.snapshot.created', { organizationId, snapshotId: snapshot.id, category: 'sales' });
      return snapshot;
    },

    async get(organizationId, snapshotId) {
      return repository.findById(organizationId, snapshotId);
    },

    async list(organizationId) {
      return repository.findAll(organizationId);
    },
  };
}
