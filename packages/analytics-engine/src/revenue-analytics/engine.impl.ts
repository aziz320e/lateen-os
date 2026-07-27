/**
 * Real Revenue Analytics engine — MRR, ARR, monthly/quarterly/yearly
 * revenue, growth, and revenue broken down by product and market.
 * Composes the real, optional Sales Engine and CRM Engine query ports
 * (never a repository). Reuses the Trend Engine's pure bucketing
 * functions for deterministic calendar-period matching.
 *
 * Design note: this package has no subscription/recurrence model, so
 * MRR is a proxy — the sum of closed-won deal amounts closing within
 * the calendar month containing `asOf`. "Revenue by market" groups by
 * the CRM Account's `industry` field (the closest real, available
 * market-segmentation signal), falling back to `'unknown'` when an
 * opportunity has no account or CRM is not injected.
 *
 * @module revenue-analytics/engine.impl
 */
import type { SalesRuntime } from '@lateen-os/sales-engine';
import type { CrmRuntime } from '@lateen-os/crm-engine';
import { bucketKeyForGranularity } from '../trend/engine.impl.js';
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, RevenueAnalyticsId } from '../shared/identifiers.js';
import type { RevenueAnalyticsRepository } from './repository.js';
import type { RevenueAnalyticsSnapshot } from './types.js';

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function parseAmount(amount?: string): number {
  return amount ? Number(amount) : 0;
}

/** Pure: percentage change from `previous` to `current`, `0` when `previous` is `0`. */
export function computeGrowthPercentage(previous: number, current: number): number {
  return previous === 0 ? 0 : round2(((current - previous) / previous) * 100);
}

/** Pure: sums a deal amount field for every deal whose `closedAt` falls in the same calendar bucket as `asOf`. */
export function sumRevenueInPeriod(
  deals: readonly { readonly amount?: string; readonly closedAt?: string }[],
  asOf: string,
  granularity: 'month' | 'quarter' | 'year',
): number {
  const targetKey = bucketKeyForGranularity(asOf, granularity);
  return round2(
    deals
      .filter((deal) => deal.closedAt !== undefined && bucketKeyForGranularity(deal.closedAt, granularity) === targetKey)
      .reduce((sum, deal) => sum + parseAmount(deal.amount), 0),
  );
}

export interface RevenueAnalyticsDeps {
  readonly sales?: Pick<SalesRuntime, 'queries'>;
  readonly crm?: Pick<CrmRuntime, 'queries'>;
}

export interface ComputeRevenueSnapshotInput {
  readonly asOf?: string;
  readonly previousAsOf?: string;
}

export interface RevenueAnalyticsEngine {
  computeSnapshot(organizationId: OrganizationId, input?: ComputeRevenueSnapshotInput): Promise<RevenueAnalyticsSnapshot>;
  get(organizationId: OrganizationId, snapshotId: RevenueAnalyticsId): Promise<RevenueAnalyticsSnapshot | null>;
  list(organizationId: OrganizationId): Promise<readonly RevenueAnalyticsSnapshot[]>;
}

/** Creates a real {@link RevenueAnalyticsEngine} over the optional Sales Engine / CRM Engine collaborators. */
export function createRevenueAnalyticsEngine(
  repository: RevenueAnalyticsRepository,
  deps: RevenueAnalyticsDeps = {},
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): RevenueAnalyticsEngine {
  return {
    async computeSnapshot(organizationId, input) {
      const asOf = input?.asOf ?? now();

      const wonOpportunities = deps.sales
        ? (await deps.sales.queries.findOpportunities({ organizationId, stage: 'won' })).opportunities
        : [];

      const monthlyRevenue = sumRevenueInPeriod(wonOpportunities, asOf, 'month');
      const quarterlyRevenue = sumRevenueInPeriod(wonOpportunities, asOf, 'quarter');
      const yearlyRevenue = sumRevenueInPeriod(wonOpportunities, asOf, 'year');
      const mrr = monthlyRevenue;
      const arr = round2(mrr * 12);

      const previousMonthlyRevenue = input?.previousAsOf ? sumRevenueInPeriod(wonOpportunities, input.previousAsOf, 'month') : 0;
      const growthPercentage = input?.previousAsOf ? computeGrowthPercentage(previousMonthlyRevenue, monthlyRevenue) : 0;

      const revenueByProduct: Record<string, number> = {};
      if (deps.sales) {
        for (const opportunity of wonOpportunities) {
          const { quotes } = await deps.sales.queries.findQuotes({ organizationId, opportunityId: opportunity.id });
          for (const quote of quotes) {
            for (const lineItem of quote.lineItems) {
              const key = lineItem.productId ?? 'unspecified';
              const lineRevenue = Number(lineItem.quantity) * Number(lineItem.unitPrice);
              revenueByProduct[key] = round2((revenueByProduct[key] ?? 0) + lineRevenue);
            }
          }
        }
      }

      const revenueByMarket: Record<string, number> = {};
      const accountIndustryById = new Map<string, string>();
      if (deps.crm) {
        const { accounts } = await deps.crm.queries.findAccounts({ organizationId });
        for (const account of accounts) accountIndustryById.set(account.id, account.industry ?? 'unknown');
      }
      for (const opportunity of wonOpportunities) {
        const market = (opportunity.accountId && accountIndustryById.get(opportunity.accountId)) || 'unknown';
        revenueByMarket[market] = round2((revenueByMarket[market] ?? 0) + parseAmount(opportunity.amount));
      }

      const timestamp = now();
      const snapshot: RevenueAnalyticsSnapshot = {
        id: generateId('revenue-analytics'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        asOf,
        mrr,
        arr,
        monthlyRevenue,
        quarterlyRevenue,
        yearlyRevenue,
        growthPercentage,
        revenueByProduct,
        revenueByMarket,
        computedAt: timestamp,
      };
      await repository.save(snapshot);
      eventBus?.publish('analytics.snapshot.created', { organizationId, snapshotId: snapshot.id, category: 'revenue' });
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
