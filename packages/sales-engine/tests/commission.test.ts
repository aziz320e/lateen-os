import { describe, expect, it } from 'vitest';
import { createCommissionPlanRepository } from '../src/commission/repository.impl.js';
import { calculateCommission, createCommissionEngine } from '../src/commission/engine.impl.js';
import { CommissionPlanNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('calculateCommission (pure)', () => {
  it('fixed plans return the fixed amount regardless of deal size', () => {
    const plan = { planType: 'fixed' as const, fixedAmount: '500.00' };
    expect(calculateCommission(plan, '10000.00')).toBe('500.00');
    expect(calculateCommission(plan, '1.00')).toBe('500.00');
  });

  it('percentage plans compute a flat rate of the deal amount', () => {
    const plan = { planType: 'percentage' as const, percentageRate: '10' };
    expect(calculateCommission(plan, '1000.00')).toBe('100.00');
  });

  it('tiered plans apply the highest matching tier to the whole deal amount', () => {
    const plan = {
      planType: 'tiered' as const,
      tiers: [
        { minAmount: '0', rate: '5' },
        { minAmount: '10000', rate: '8' },
        { minAmount: '50000', rate: '12' },
      ],
    };
    expect(calculateCommission(plan, '5000.00')).toBe('250.00');
    expect(calculateCommission(plan, '20000.00')).toBe('1600.00');
    expect(calculateCommission(plan, '75000.00')).toBe('9000.00');
  });

  it('tiered plans with no matching tier return 0.00', () => {
    const plan = { planType: 'tiered' as const, tiers: [{ minAmount: '1000', rate: '10' }] };
    expect(calculateCommission(plan, '500.00')).toBe('0.00');
  });

  it('tiered plans with no tiers at all return 0.00', () => {
    const plan = { planType: 'tiered' as const };
    expect(calculateCommission(plan, '500.00')).toBe('0.00');
  });
});

function setup() {
  const repository = createCommissionPlanRepository();
  const engine = createCommissionEngine(repository);
  return { repository, engine };
}

describe('createCommissionEngine', () => {
  it('createPlan() creates an active plan', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { name: 'Standard', planType: 'percentage', percentageRate: '10' });
    expect(plan.status).toBe('active');
    expect(plan.planType).toBe('percentage');
  });

  it('getPlan() returns null for an unknown plan', async () => {
    const { engine } = setup();
    expect(await engine.getPlan(ORG, 'missing')).toBeNull();
  });

  it('archivePlan() sets status archived', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { name: 'Standard', planType: 'fixed', fixedAmount: '100.00' });
    const archived = await engine.archivePlan(ORG, plan.id);
    expect(archived.status).toBe('archived');
  });

  it('archivePlan() throws CommissionPlanNotFoundError for an unknown plan', async () => {
    const { engine } = setup();
    await expect(engine.archivePlan(ORG, 'missing')).rejects.toBeInstanceOf(CommissionPlanNotFoundError);
  });

  it('calculateCommissionForPlan() loads the plan and computes the commission', async () => {
    const { engine } = setup();
    const plan = await engine.createPlan(ORG, { name: 'Tiered', planType: 'tiered', tiers: [{ minAmount: '0', rate: '5' }] });
    const commission = await engine.calculateCommissionForPlan(ORG, plan.id, '1000.00');
    expect(commission).toBe('50.00');
  });

  it('calculateCommissionForPlan() returns null for an unknown plan', async () => {
    const { engine } = setup();
    expect(await engine.calculateCommissionForPlan(ORG, 'missing', '1000.00')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { repository, engine } = setup();
    const plan = await engine.createPlan(ORG, { name: 'Standard', planType: 'percentage', percentageRate: '10' });
    expect(await repository.findById('org-2', plan.id)).toBeNull();
  });
});
