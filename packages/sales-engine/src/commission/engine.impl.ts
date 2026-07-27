/**
 * Real Commission Engine — fixed, percentage, and tiered commission
 * plans, plus a pure, deterministic calculator.
 *
 * @module commission/engine.impl
 */
import { CommissionPlanNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CommissionPlanId, OrganizationId } from '../shared/identifiers.js';
import type { CommissionPlanRepository } from './repository.js';
import type { CommissionPlan, CommissionPlanType, CommissionTier } from './types.js';

function parseDecimal(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toMoney(value: number): string {
  return value.toFixed(2);
}

/** Pure, deterministic commission calculation for a single deal amount against a plan. */
export function calculateCommission(plan: Pick<CommissionPlan, 'planType' | 'fixedAmount' | 'percentageRate' | 'tiers'>, dealAmount: string): string {
  const amount = parseDecimal(dealAmount);

  if (plan.planType === 'fixed') {
    return toMoney(parseDecimal(plan.fixedAmount));
  }

  if (plan.planType === 'percentage') {
    return toMoney(amount * (parseDecimal(plan.percentageRate) / 100));
  }

  const tiers: readonly CommissionTier[] = plan.tiers ?? [];
  const applicableTier = [...tiers]
    .filter((tier) => parseDecimal(tier.minAmount) <= amount)
    .sort((a, b) => parseDecimal(b.minAmount) - parseDecimal(a.minAmount))[0];
  if (!applicableTier) return toMoney(0);
  return toMoney(amount * (parseDecimal(applicableTier.rate) / 100));
}

export interface CreateCommissionPlanInput {
  readonly name: string;
  readonly planType: CommissionPlanType;
  readonly fixedAmount?: string;
  readonly percentageRate?: string;
  readonly tiers?: readonly CommissionTier[];
}

export interface CommissionEngine {
  createPlan(organizationId: OrganizationId, input: CreateCommissionPlanInput): Promise<CommissionPlan>;
  archivePlan(organizationId: OrganizationId, planId: CommissionPlanId): Promise<CommissionPlan>;
  getPlan(organizationId: OrganizationId, planId: CommissionPlanId): Promise<CommissionPlan | null>;
  /** Loads the named plan and calculates the commission for a deal amount. `null` if the plan is unknown. */
  calculateCommissionForPlan(organizationId: OrganizationId, planId: CommissionPlanId, dealAmount: string): Promise<string | null>;
}

/** Creates a real {@link CommissionEngine} backed by a {@link CommissionPlanRepository}. */
export function createCommissionEngine(repository: CommissionPlanRepository, now: () => string = nowIso): CommissionEngine {
  async function requirePlan(organizationId: OrganizationId, planId: CommissionPlanId): Promise<CommissionPlan> {
    const plan = await repository.findById(organizationId, planId);
    if (!plan) throw new CommissionPlanNotFoundError(planId);
    return plan;
  }

  return {
    async createPlan(organizationId, input) {
      const timestamp = now();
      const plan: CommissionPlan = {
        id: generateId('commission-plan'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        planType: input.planType,
        status: 'active',
        fixedAmount: input.fixedAmount,
        percentageRate: input.percentageRate,
        tiers: input.tiers,
      };
      await repository.save(plan);
      return plan;
    },

    async archivePlan(organizationId, planId) {
      const plan = await requirePlan(organizationId, planId);
      const updated: CommissionPlan = { ...plan, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getPlan(organizationId, planId) {
      return repository.findById(organizationId, planId);
    },

    async calculateCommissionForPlan(organizationId, planId, dealAmount) {
      const plan = await repository.findById(organizationId, planId);
      if (!plan) return null;
      return calculateCommission(plan, dealAmount);
    },
  };
}
