/**
 * Real Performance Metrics engine — win rate, loss rate, average deal
 * size, average sales cycle, and pipeline value, computed deterministically
 * over the Sales Opportunity repository. No AI/LLM.
 *
 * @module metrics/engine.impl
 */
import type { SalesOpportunityRepository } from '../opportunity/repository.js';
import type { SalesOpportunity } from '../opportunity/types.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { SalesPerformanceMetrics } from './types.js';

function parseDecimal(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoney(value: number): string {
  return value.toFixed(2);
}

function toPercent(value: number): string {
  return value.toFixed(2);
}

function toFixed2(value: number): string {
  return value.toFixed(2);
}

/** Pure: percentage of closed deals that were won. `0` when there are no closed deals. */
export function computeWinRate(wonCount: number, lostCount: number): string {
  const closed = wonCount + lostCount;
  return closed === 0 ? toPercent(0) : toPercent((wonCount / closed) * 100);
}

/** Pure: percentage of closed deals that were lost. `0` when there are no closed deals. */
export function computeLossRate(wonCount: number, lostCount: number): string {
  const closed = wonCount + lostCount;
  return closed === 0 ? toPercent(0) : toPercent((lostCount / closed) * 100);
}

/** Pure: mean `amount` across won deals. `0` when there are none. */
export function computeAverageDealSize(wonOpportunities: readonly SalesOpportunity[]): string {
  if (wonOpportunities.length === 0) return toMoney(0);
  const total = wonOpportunities.reduce((sum, opportunity) => sum + parseDecimal(opportunity.amount), 0);
  return toMoney(total / wonOpportunities.length);
}

/** Pure: mean days between `createdAt` and `closedAt` across every closed (won or lost) deal. `0` when there are none. */
export function computeAverageSalesCycleDays(closedOpportunities: readonly SalesOpportunity[]): string {
  const withCycle = closedOpportunities.filter((opportunity) => opportunity.closedAt);
  if (withCycle.length === 0) return toFixed2(0);
  const totalDays = withCycle.reduce((sum, opportunity) => {
    const created = new Date(opportunity.createdAt).getTime();
    const closed = new Date(opportunity.closedAt!).getTime();
    return sum + Math.max(0, closed - created) / (1000 * 60 * 60 * 24);
  }, 0);
  return toFixed2(totalDays / withCycle.length);
}

/** Pure: total `amount` across every open (active, not won/lost) opportunity. */
export function computePipelineValue(openOpportunities: readonly SalesOpportunity[]): string {
  return toMoney(openOpportunities.reduce((sum, opportunity) => sum + parseDecimal(opportunity.amount), 0));
}

export interface PerformanceMetricsEngine {
  getMetrics(organizationId: OrganizationId): Promise<SalesPerformanceMetrics>;
}

/** Creates a real {@link PerformanceMetricsEngine} over the Sales Opportunity repository. */
export function createPerformanceMetricsEngine(repository: SalesOpportunityRepository): PerformanceMetricsEngine {
  return {
    async getMetrics(organizationId) {
      const opportunities = await repository.findAll(organizationId);
      const won = opportunities.filter((opportunity) => opportunity.stage === 'won');
      const lost = opportunities.filter((opportunity) => opportunity.stage === 'lost');
      const open = opportunities.filter((opportunity) => opportunity.status === 'active' && opportunity.stage !== 'won' && opportunity.stage !== 'lost');

      return {
        organizationId,
        winRate: computeWinRate(won.length, lost.length),
        lossRate: computeLossRate(won.length, lost.length),
        averageDealSize: computeAverageDealSize(won),
        averageSalesCycleDays: computeAverageSalesCycleDays([...won, ...lost]),
        pipelineValue: computePipelineValue(open),
        closedWonCount: won.length,
        closedLostCount: lost.length,
        openCount: open.length,
      };
    },
  };
}
