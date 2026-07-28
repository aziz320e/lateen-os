import { describe, expect, it } from 'vitest';
import { createCustomerSuccessRecordRepository } from '../src/customer/repository.impl.js';
import { createExpansionOpportunityRepository } from '../src/expansion/repository.impl.js';
import { createFeedbackEntryRepository } from '../src/feedback/repository.impl.js';
import { createHealthSnapshotRepository } from '../src/health/repository.impl.js';
import { createCustomerSuccessQueries } from '../src/queries/customer-success-queries.impl.js';
import { createRenewalRepository } from '../src/renewal/repository.impl.js';
import { createCustomerRiskRepository } from '../src/risk/repository.impl.js';
import { createSuccessPlanRepository } from '../src/successplan/repository.impl.js';

const ORG = 'org-1';
const timestamp = '2026-01-01T00:00:00.000Z';

function setup() {
  const customerRepository = createCustomerSuccessRecordRepository();
  const healthRepository = createHealthSnapshotRepository();
  const renewalRepository = createRenewalRepository();
  const planRepository = createSuccessPlanRepository();
  const feedbackRepository = createFeedbackEntryRepository();
  const riskRepository = createCustomerRiskRepository();
  const expansionRepository = createExpansionOpportunityRepository();

  const queries = createCustomerSuccessQueries({
    customerRepository,
    healthRepository,
    renewalRepository,
    planRepository,
    feedbackRepository,
    riskRepository,
    expansionRepository,
  });

  return { queries, customerRepository, healthRepository, renewalRepository, planRepository, feedbackRepository, riskRepository, expansionRepository };
}

describe('CustomerSuccessQueries — findCustomers', () => {
  it('returns all records for an organization', async () => {
    const { queries, customerRepository } = setup();
    await customerRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', status: 'onboarding', currentVersion: 1 });
    await customerRepository.save({ id: 'r2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-2', status: 'activation', currentVersion: 1 });
    expect((await queries.findCustomers({ organizationId: ORG })).total).toBe(2);
  });

  it('filters by customerId and status', async () => {
    const { queries, customerRepository } = setup();
    await customerRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', status: 'onboarding', currentVersion: 1 });
    await customerRepository.save({ id: 'r2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-2', status: 'activation', currentVersion: 1 });
    expect((await queries.findCustomers({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await queries.findCustomers({ organizationId: ORG, status: 'activation' })).total).toBe(1);
  });

  it('returns an empty result for an unknown customerId', async () => {
    const { queries } = setup();
    expect((await queries.findCustomers({ organizationId: ORG, customerId: 'missing' })).total).toBe(0);
  });
});

describe('CustomerSuccessQueries — findHealth', () => {
  it('filters by customer', async () => {
    const { queries, healthRepository } = setup();
    await healthRepository.save({
      id: 'h1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1',
      usageScore: 80, communicationScore: 80, projectScore: 80, paymentScore: 80, engagementScore: 80, renewalScore: 80, overallScore: 80, tier: 'healthy',
    });
    await healthRepository.save({
      id: 'h2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-2',
      usageScore: 10, communicationScore: 10, projectScore: 10, paymentScore: 10, engagementScore: 10, renewalScore: 10, overallScore: 10, tier: 'critical',
    });
    expect((await queries.findHealth({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await queries.findHealth({ organizationId: ORG })).total).toBe(2);
  });
});

describe('CustomerSuccessQueries — findRenewals', () => {
  it('filters by customer and status', async () => {
    const { queries, renewalRepository } = setup();
    await renewalRepository.save({ id: 're1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', renewalDate: '2026-06-01', probability: 50, status: 'pipeline', reminders: [] });
    await renewalRepository.save({ id: 're2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-2', renewalDate: '2026-07-01', probability: 50, status: 'won', reminders: [] });
    expect((await queries.findRenewals({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await queries.findRenewals({ organizationId: ORG, status: 'won' })).total).toBe(1);
  });
});

describe('CustomerSuccessQueries — findPlans', () => {
  it('filters by customer and status', async () => {
    const { queries, planRepository } = setup();
    await planRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', name: 'A', status: 'active', currentVersion: 1 });
    await planRepository.save({ id: 'p2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-2', name: 'B', status: 'completed', currentVersion: 1 });
    expect((await queries.findPlans({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await queries.findPlans({ organizationId: ORG, status: 'completed' })).total).toBe(1);
  });
});

describe('CustomerSuccessQueries — findFeedback', () => {
  it('filters by customer and feedbackType', async () => {
    const { queries, feedbackRepository } = setup();
    await feedbackRepository.save({ id: 'f1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    await feedbackRepository.save({ id: 'f2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-2', feedbackType: 'csat', score: 5 });
    expect((await queries.findFeedback({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await queries.findFeedback({ organizationId: ORG, feedbackType: 'csat' })).total).toBe(1);
  });
});

describe('CustomerSuccessQueries — findRisks', () => {
  it('filters by customer and status', async () => {
    const { queries, riskRepository } = setup();
    await riskRepository.save({ id: 'ri1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', title: 'A', probability: 3, impact: 3, score: 9, status: 'identified' });
    await riskRepository.save({ id: 'ri2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-2', title: 'B', probability: 5, impact: 5, score: 25, status: 'occurred' });
    expect((await queries.findRisks({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await queries.findRisks({ organizationId: ORG, status: 'occurred' })).total).toBe(1);
  });
});

describe('CustomerSuccessQueries — findExpansion', () => {
  it('filters by customer, opportunityType, and status', async () => {
    const { queries, expansionRepository } = setup();
    await expansionRepository.save({ id: 'e1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', opportunityType: 'upsell', status: 'identified' });
    await expansionRepository.save({ id: 'e2', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-2', opportunityType: 'cross_sell', status: 'won' });
    expect((await queries.findExpansion({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await queries.findExpansion({ organizationId: ORG, opportunityType: 'cross_sell' })).total).toBe(1);
    expect((await queries.findExpansion({ organizationId: ORG, status: 'won' })).total).toBe(1);
  });
});

describe('CustomerSuccessQueries — searchCustomerSuccess', () => {
  it('finds matches across customers, plans, and risks, ranked by score', async () => {
    const { queries, customerRepository, planRepository, riskRepository } = setup();
    await customerRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'Acme', status: 'onboarding', currentVersion: 1 });
    await planRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', name: 'Acme Growth Plan', status: 'active', currentVersion: 1 });
    await riskRepository.save({ id: 'ri1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', title: 'Unrelated risk', probability: 1, impact: 1, score: 1, status: 'identified' });

    const result = await queries.searchCustomerSuccess({ organizationId: ORG, keyword: 'Acme' });
    expect(result.total).toBe(2);
    expect(result.matches[0]).toMatchObject({ recordType: 'customer', id: 'r1', score: 3 });
  });

  it('returns no matches for an unrelated keyword', async () => {
    const { queries, customerRepository } = setup();
    await customerRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'Acme', status: 'onboarding', currentVersion: 1 });
    expect((await queries.searchCustomerSuccess({ organizationId: ORG, keyword: 'zzz-nonexistent' })).total).toBe(0);
  });

  it('respects a limit on the number of matches returned', async () => {
    const { queries, planRepository } = setup();
    for (let i = 0; i < 5; i += 1) {
      await planRepository.save({ id: `p${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', name: `Widget Plan ${i}`, status: 'active', currentVersion: 1 });
    }
    const result = await queries.searchCustomerSuccess({ organizationId: ORG, keyword: 'Widget', limit: 2 });
    expect(result.total).toBe(5);
    expect(result.matches).toHaveLength(2);
  });

  it('search results never leak across organizations', async () => {
    const { queries, customerRepository } = setup();
    await customerRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'UniqueName', status: 'onboarding', currentVersion: 1 });
    await customerRepository.save({ id: 'r2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, customerId: 'UniqueName', status: 'onboarding', currentVersion: 1 });
    expect((await queries.searchCustomerSuccess({ organizationId: ORG, keyword: 'UniqueName' })).total).toBe(1);
  });
});

describe('CustomerSuccessQueries — pagination', () => {
  it('findRenewals respects offset without a limit', async () => {
    const { queries, renewalRepository } = setup();
    for (let i = 0; i < 3; i += 1) {
      await renewalRepository.save({ id: `re${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', renewalDate: '2026-06-01', probability: 50, status: 'pipeline', reminders: [] });
    }
    const result = await queries.findRenewals({ organizationId: ORG, offset: 1 });
    expect(result.total).toBe(3);
    expect(result.renewals).toHaveLength(2);
  });

  it('findPlans respects offset and limit together', async () => {
    const { queries, planRepository } = setup();
    for (let i = 0; i < 5; i += 1) {
      await planRepository.save({ id: `p${i}`, organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', name: `Plan ${i}`, status: 'active', currentVersion: 1 });
    }
    const result = await queries.findPlans({ organizationId: ORG, offset: 2, limit: 2 });
    expect(result.total).toBe(5);
    expect(result.plans).toHaveLength(2);
  });
});

describe('CustomerSuccessQueries — empty results', () => {
  it('findCustomers returns an empty result for an organization with no records', async () => {
    const { queries } = setup();
    expect((await queries.findCustomers({ organizationId: ORG })).total).toBe(0);
  });

  it('findHealth returns an empty result for an organization with no snapshots', async () => {
    const { queries } = setup();
    expect((await queries.findHealth({ organizationId: ORG })).total).toBe(0);
  });

  it('findRenewals returns an empty result for an organization with no renewals', async () => {
    const { queries } = setup();
    expect((await queries.findRenewals({ organizationId: ORG })).total).toBe(0);
  });

  it('findPlans returns an empty result for an organization with no plans', async () => {
    const { queries } = setup();
    expect((await queries.findPlans({ organizationId: ORG })).total).toBe(0);
  });

  it('findFeedback returns an empty result for an organization with no feedback', async () => {
    const { queries } = setup();
    expect((await queries.findFeedback({ organizationId: ORG })).total).toBe(0);
  });

  it('findRisks returns an empty result for an organization with no risks', async () => {
    const { queries } = setup();
    expect((await queries.findRisks({ organizationId: ORG })).total).toBe(0);
  });

  it('findExpansion returns an empty result for an organization with no opportunities', async () => {
    const { queries } = setup();
    expect((await queries.findExpansion({ organizationId: ORG })).total).toBe(0);
  });

  it('searchCustomerSuccess returns an empty result for an organization with no data', async () => {
    const { queries } = setup();
    expect((await queries.searchCustomerSuccess({ organizationId: ORG, keyword: 'anything' })).total).toBe(0);
  });
});

describe('CustomerSuccessQueries — organization scoping', () => {
  it('findHealth never leaks across organizations', async () => {
    const { queries, healthRepository } = setup();
    await healthRepository.save({
      id: 'h1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1',
      usageScore: 80, communicationScore: 80, projectScore: 80, paymentScore: 80, engagementScore: 80, renewalScore: 80, overallScore: 80, tier: 'healthy',
    });
    await healthRepository.save({
      id: 'h2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1',
      usageScore: 80, communicationScore: 80, projectScore: 80, paymentScore: 80, engagementScore: 80, renewalScore: 80, overallScore: 80, tier: 'healthy',
    });
    expect((await queries.findHealth({ organizationId: ORG })).total).toBe(1);
  });

  it('findRisks never leaks across organizations', async () => {
    const { queries, riskRepository } = setup();
    await riskRepository.save({ id: 'ri1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', title: 'A', probability: 1, impact: 1, score: 1, status: 'identified' });
    await riskRepository.save({ id: 'ri2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', title: 'A', probability: 1, impact: 1, score: 1, status: 'identified' });
    expect((await queries.findRisks({ organizationId: ORG })).total).toBe(1);
  });

  it('findExpansion never leaks across organizations', async () => {
    const { queries, expansionRepository } = setup();
    await expansionRepository.save({ id: 'e1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', opportunityType: 'upsell', status: 'identified' });
    await expansionRepository.save({ id: 'e2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', opportunityType: 'upsell', status: 'identified' });
    expect((await queries.findExpansion({ organizationId: ORG })).total).toBe(1);
  });

  it('findCustomers never leaks across organizations', async () => {
    const { queries, customerRepository } = setup();
    await customerRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', status: 'onboarding', currentVersion: 1 });
    await customerRepository.save({ id: 'r2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', status: 'onboarding', currentVersion: 1 });
    expect((await queries.findCustomers({ organizationId: ORG })).total).toBe(1);
  });

  it('findRenewals never leaks across organizations', async () => {
    const { queries, renewalRepository } = setup();
    await renewalRepository.save({ id: 're1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', renewalDate: '2026-01-01', probability: 50, status: 'pipeline', reminders: [] });
    await renewalRepository.save({ id: 're2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', renewalDate: '2026-01-01', probability: 50, status: 'pipeline', reminders: [] });
    expect((await queries.findRenewals({ organizationId: ORG })).total).toBe(1);
  });

  it('findPlans never leaks across organizations', async () => {
    const { queries, planRepository } = setup();
    await planRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', name: 'A', status: 'active', currentVersion: 1 });
    await planRepository.save({ id: 'p2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', name: 'A', status: 'active', currentVersion: 1 });
    expect((await queries.findPlans({ organizationId: ORG })).total).toBe(1);
  });

  it('findFeedback never leaks across organizations', async () => {
    const { queries, feedbackRepository } = setup();
    await feedbackRepository.save({ id: 'f1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    await feedbackRepository.save({ id: 'f2', organizationId: 'org-2', createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', feedbackType: 'nps', score: 9 });
    expect((await queries.findFeedback({ organizationId: ORG })).total).toBe(1);
  });

  it('findCustomers combines customerId and status filters together', async () => {
    const { queries, customerRepository } = setup();
    await customerRepository.save({ id: 'r1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', status: 'onboarding', currentVersion: 1 });
    const result = await queries.findCustomers({ organizationId: ORG, customerId: 'customer-1', status: 'activation' });
    expect(result.total).toBe(0);
  });

  it('findRenewals combines customerId and status filters together', async () => {
    const { queries, renewalRepository } = setup();
    await renewalRepository.save({ id: 're1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', renewalDate: '2026-01-01', probability: 50, status: 'pipeline', reminders: [] });
    const result = await queries.findRenewals({ organizationId: ORG, customerId: 'customer-1', status: 'won' });
    expect(result.total).toBe(0);
  });

  it('findExpansion combines all three filters together', async () => {
    const { queries, expansionRepository } = setup();
    await expansionRepository.save({ id: 'e1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', opportunityType: 'upsell', status: 'identified' });
    const result = await queries.findExpansion({ organizationId: ORG, customerId: 'customer-1', opportunityType: 'upsell', status: 'identified' });
    expect(result.total).toBe(1);
  });

  it('searchCustomerSuccess is case-insensitive', async () => {
    const { queries, planRepository } = setup();
    await planRepository.save({ id: 'p1', organizationId: ORG, createdAt: timestamp, updatedAt: timestamp, customerId: 'customer-1', name: 'GROWTH PLAN', status: 'active', currentVersion: 1 });
    const result = await queries.searchCustomerSuccess({ organizationId: ORG, keyword: 'growth plan' });
    expect(result.total).toBe(1);
  });
});
