/**
 * Real KPI Engine — deterministic calculation and snapshot persistence
 * for the twelve required KPIs. Pure calculators are exported
 * independently of the stateful `record*` methods so they can be
 * tested (and reused) without any repository or event bus. No AI
 * model — every KPI is a fixed formula over caller-supplied inputs.
 *
 * @module kpi/engine.impl
 */
import type { AnalyticsEventBus } from '../events/analytics-event-bus.js';
import { generateId, nowIso } from '../shared/id.js';
import type { KpiSnapshotId, OrganizationId } from '../shared/identifiers.js';
import type { KpiSnapshotRepository } from './repository.js';
import type { KpiSnapshot, KpiType, KpiUnit } from './types.js';

/** Pure: percentage of `numerator` out of `denominator`, `0` when the denominator is `0`. */
export function calculateConversionRate(convertedCount: number, totalCount: number): number {
  return totalCount === 0 ? 0 : round2((convertedCount / totalCount) * 100);
}

/** Pure: win rate as a percentage of closed (won + lost) deals that were won. */
export function calculateWinRate(wonCount: number, lostCount: number): number {
  const closed = wonCount + lostCount;
  return closed === 0 ? 0 : round2((wonCount / closed) * 100);
}

/** Pure: average deal size across a set of deals. */
export function calculateAverageDealSize(totalAmount: number, dealCount: number): number {
  return dealCount === 0 ? 0 : round2(totalAmount / dealCount);
}

/** Pure: customer acquisition cost — total acquisition cost divided by new customers acquired. */
export function calculateCustomerAcquisitionCost(totalCost: number, newCustomers: number): number {
  return newCustomers === 0 ? 0 : round2(totalCost / newCustomers);
}

/** Pure: customer lifetime value — average deal size × purchase frequency per year × customer lifespan in years. */
export function calculateCustomerLifetimeValue(averageDealSize: number, purchaseFrequencyPerYear: number, customerLifespanYears: number): number {
  return round2(averageDealSize * purchaseFrequencyPerYear * customerLifespanYears);
}

/** Pure: marketing ROI as a percentage — `(revenue - cost) / cost * 100`, `0` when cost is `0`. */
export function calculateMarketingRoi(revenue: number, cost: number): number {
  return cost === 0 ? 0 : round2(((revenue - cost) / cost) * 100);
}

/** Pure: average response time in minutes across a set of (sentAt, respondedAt) pairs. */
export function calculateAverageResponseTimeMinutes(pairs: readonly { readonly sentAt: string; readonly respondedAt: string }[]): number {
  if (pairs.length === 0) return 0;
  const totalMinutes = pairs.reduce((sum, pair) => sum + (new Date(pair.respondedAt).getTime() - new Date(pair.sentAt).getTime()) / 60_000, 0);
  return round2(totalMinutes / pairs.length);
}

/** Pure: workflow completion rate as a percentage. */
export function calculateWorkflowCompletionRate(completedCount: number, totalCount: number): number {
  return totalCount === 0 ? 0 : round2((completedCount / totalCount) * 100);
}

/** Pure: workforce utilization as a percentage of busy workers out of every active worker. */
export function calculateWorkforceUtilization(busyCount: number, activeCount: number): number {
  return activeCount === 0 ? 0 : round2((busyCount / activeCount) * 100);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface RecordKpiInput {
  readonly value: number;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface KpiEngine {
  recordRevenue(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordPipelineValue(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordConversionRate(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordWinRate(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordAverageDealSize(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordCustomerAcquisitionCost(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordCustomerLifetimeValue(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordMarketingRoi(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordCampaignPerformance(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordResponseTime(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordWorkflowCompletion(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  recordWorkforceUtilization(organizationId: OrganizationId, input: RecordKpiInput): Promise<KpiSnapshot>;
  get(organizationId: OrganizationId, kpiSnapshotId: KpiSnapshotId): Promise<KpiSnapshot | null>;
  findByType(organizationId: OrganizationId, kpiType: KpiType): Promise<readonly KpiSnapshot[]>;
  /** The most recently recorded snapshot for a KPI type, or `null` if none has been recorded. */
  getLatest(organizationId: OrganizationId, kpiType: KpiType): Promise<KpiSnapshot | null>;
}

const KPI_UNITS: Readonly<Record<KpiType, KpiUnit>> = {
  revenue: 'currency',
  pipeline_value: 'currency',
  conversion_rate: 'percentage',
  win_rate: 'percentage',
  average_deal_size: 'currency',
  customer_acquisition_cost: 'currency',
  customer_lifetime_value: 'currency',
  marketing_roi: 'percentage',
  campaign_performance: 'ratio',
  response_time: 'minutes',
  workflow_completion: 'percentage',
  workforce_utilization: 'percentage',
};

/** Creates a real {@link KpiEngine} backed by a {@link KpiSnapshotRepository}. */
export function createKpiEngine(
  repository: KpiSnapshotRepository,
  eventBus?: AnalyticsEventBus,
  now: () => string = nowIso,
): KpiEngine {
  async function record(organizationId: OrganizationId, kpiType: KpiType, input: RecordKpiInput): Promise<KpiSnapshot> {
    const timestamp = now();
    const snapshot: KpiSnapshot = {
      id: generateId('kpi-snapshot'),
      organizationId,
      createdAt: timestamp,
      updatedAt: timestamp,
      kpiType,
      value: input.value,
      unit: KPI_UNITS[kpiType],
      context: input.context,
      calculatedAt: timestamp,
    };
    await repository.save(snapshot);
    eventBus?.publish('kpi.updated', { organizationId, kpiSnapshotId: snapshot.id, kpiType, value: snapshot.value });
    return snapshot;
  }

  return {
    recordRevenue: (organizationId, input) => record(organizationId, 'revenue', input),
    recordPipelineValue: (organizationId, input) => record(organizationId, 'pipeline_value', input),
    recordConversionRate: (organizationId, input) => record(organizationId, 'conversion_rate', input),
    recordWinRate: (organizationId, input) => record(organizationId, 'win_rate', input),
    recordAverageDealSize: (organizationId, input) => record(organizationId, 'average_deal_size', input),
    recordCustomerAcquisitionCost: (organizationId, input) => record(organizationId, 'customer_acquisition_cost', input),
    recordCustomerLifetimeValue: (organizationId, input) => record(organizationId, 'customer_lifetime_value', input),
    recordMarketingRoi: (organizationId, input) => record(organizationId, 'marketing_roi', input),
    recordCampaignPerformance: (organizationId, input) => record(organizationId, 'campaign_performance', input),
    recordResponseTime: (organizationId, input) => record(organizationId, 'response_time', input),
    recordWorkflowCompletion: (organizationId, input) => record(organizationId, 'workflow_completion', input),
    recordWorkforceUtilization: (organizationId, input) => record(organizationId, 'workforce_utilization', input),

    async get(organizationId, kpiSnapshotId) {
      return repository.findById(organizationId, kpiSnapshotId);
    },

    async findByType(organizationId, kpiType) {
      return repository.findByType(organizationId, kpiType);
    },

    async getLatest(organizationId, kpiType) {
      const snapshots = await repository.findByType(organizationId, kpiType);
      if (snapshots.length === 0) return null;
      return [...snapshots].reverse().sort((a, b) => (a.calculatedAt < b.calculatedAt ? 1 : a.calculatedAt > b.calculatedAt ? -1 : 0))[0]!;
    },
  };
}
