import { describe, expect, it } from 'vitest';
import { createCustomerSuccessRuntime } from '../src/runtime.js';

const ORG = 'org-1';

describe('createCustomerSuccessRuntime', () => {
  it('wires every module together and works fully offline', async () => {
    const runtime = createCustomerSuccessRuntime();
    const record = await runtime.customers.onboard(ORG, { customerId: 'customer-1' });
    expect(record.status).toBe('onboarding');
    expect(await runtime.relationships.getCustomerContext(ORG, 'customer-1')).toBeNull();
  });

  it('shares one event bus across every engine by default', async () => {
    const runtime = createCustomerSuccessRuntime();
    let seen: unknown;
    runtime.events.subscribe('customer.onboarded', (payload) => (seen = payload));
    const record = await runtime.customers.onboard(ORG, { customerId: 'customer-1' });
    expect(seen).toEqual({ organizationId: ORG, customerSuccessRecordId: record.id, customerId: 'customer-1' });
  });

  it('accepts an injected event bus and clock', async () => {
    const { createCustomerSuccessEventBus } = await import('../src/events/index.js');
    const eventBus = createCustomerSuccessEventBus();
    const fixedNow = () => '2026-01-01T00:00:00.000Z';
    const runtime = createCustomerSuccessRuntime({ eventBus, now: fixedNow });
    const record = await runtime.customers.onboard(ORG, { customerId: 'customer-1' });
    expect(record.createdAt).toBe('2026-01-01T00:00:00.000Z');
    expect(runtime.events).toBe(eventBus);
  });

  it('queries reflect state mutated through the engines', async () => {
    const runtime = createCustomerSuccessRuntime();
    await runtime.customers.onboard(ORG, { customerId: 'customer-1' });
    const result = await runtime.queries.findCustomers({ organizationId: ORG });
    expect(result.total).toBe(1);
  });

  it('health, renewals, risks, and feedback all compose against the same customerId', async () => {
    const runtime = createCustomerSuccessRuntime();
    await runtime.customers.onboard(ORG, { customerId: 'customer-1' });
    await runtime.health.recordSnapshot(ORG, {
      customerId: 'customer-1',
      usageScore: 80,
      communicationScore: 80,
      projectScore: 80,
      paymentScore: 80,
      engagementScore: 80,
      renewalScore: 80,
    });
    const renewal = await runtime.renewals.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const risk = await runtime.risks.create(ORG, { customerId: 'customer-1', title: 'Champion left', probability: 3, impact: 4 });
    await runtime.feedback.recordFeedback(ORG, { customerId: 'customer-1', feedbackType: 'nps', score: 9 });

    expect((await runtime.queries.findHealth({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await runtime.queries.findRenewals({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await runtime.queries.findRisks({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await runtime.queries.findFeedback({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect(renewal.status).toBe('pipeline');
    expect(risk.score).toBe(12);
  });

  it('success plans and expansion opportunities are queryable through the runtime', async () => {
    const runtime = createCustomerSuccessRuntime();
    await runtime.customers.onboard(ORG, { customerId: 'customer-1' });
    const plan = await runtime.plans.createPlan(ORG, { customerId: 'customer-1', name: 'Growth Plan' });
    const opportunity = await runtime.expansion.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });

    expect((await runtime.queries.findPlans({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect((await runtime.queries.findExpansion({ organizationId: ORG, customerId: 'customer-1' })).total).toBe(1);
    expect(plan.status).toBe('active');
    expect(opportunity.status).toBe('identified');
  });

  it('searchCustomerSuccess() finds records created through the runtime engines', async () => {
    const runtime = createCustomerSuccessRuntime();
    await runtime.customers.onboard(ORG, { customerId: 'UniqueCustomerName' });
    const result = await runtime.queries.searchCustomerSuccess({ organizationId: ORG, keyword: 'UniqueCustomerName' });
    expect(result.total).toBe(1);
  });

  it('customer lifecycle transitions are reflected immediately in findCustomers()', async () => {
    const runtime = createCustomerSuccessRuntime();
    const record = await runtime.customers.onboard(ORG, { customerId: 'customer-1' });
    await runtime.customers.activate(ORG, record.id);
    const result = await runtime.queries.findCustomers({ organizationId: ORG, status: 'activation' });
    expect(result.total).toBe(1);
  });

  it('runtime is fully usable with zero collaborators injected', async () => {
    const runtime = createCustomerSuccessRuntime();
    expect(await runtime.relationships.getOpportunityContext(ORG, 'x')).toBeNull();
    expect(await runtime.relationships.getCustomerProjectsContext(ORG, 'x')).toEqual([]);
    expect(await runtime.relationships.notifyCustomerSuccessEvent(ORG, { title: 't' })).toBeNull();
  });

  it('multiple customers can be tracked independently within one runtime', async () => {
    const runtime = createCustomerSuccessRuntime();
    await runtime.customers.onboard(ORG, { customerId: 'customer-1' });
    await runtime.customers.onboard(ORG, { customerId: 'customer-2' });
    expect((await runtime.queries.findCustomers({ organizationId: ORG })).total).toBe(2);
  });

  it('renewal completion and expansion win/loss are independently tracked through the runtime', async () => {
    const runtime = createCustomerSuccessRuntime();
    const renewal = await runtime.renewals.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const completed = await runtime.renewals.complete(ORG, renewal.id, 'won');
    expect(completed.status).toBe('won');

    const opportunity = await runtime.expansion.identify(ORG, { customerId: 'customer-1', opportunityType: 'cross_sell' });
    await runtime.expansion.propose(ORG, opportunity.id);
    const lost = await runtime.expansion.lose(ORG, opportunity.id);
    expect(lost.status).toBe('lost');
  });

  it('risk score and health score computations remain consistent when accessed through the runtime', async () => {
    const runtime = createCustomerSuccessRuntime();
    const risk = await runtime.risks.create(ORG, { customerId: 'customer-1', title: 'X', probability: 5, impact: 5 });
    expect(risk.score).toBe(25);
    const snapshot = await runtime.health.recordSnapshot(ORG, {
      customerId: 'customer-1',
      usageScore: 100,
      communicationScore: 100,
      projectScore: 100,
      paymentScore: 100,
      engagementScore: 100,
      renewalScore: 100,
    });
    expect(snapshot.overallScore).toBe(100);
  });
});
