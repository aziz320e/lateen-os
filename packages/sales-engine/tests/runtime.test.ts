import { describe, expect, it } from 'vitest';
import { createSalesRuntime } from '../src/runtime.js';
import { createSalesEventBus } from '../src/events/sales-event-bus.js';

describe('createSalesRuntime', () => {
  it('exposes only services, queries, and the event bus — never repositories', () => {
    const runtime = createSalesRuntime();
    expect(Object.keys(runtime).sort()).toEqual(
      ['opportunities', 'quotes', 'pricing', 'forecast', 'commissions', 'activities', 'tasks', 'relationships', 'metrics', 'queries', 'events'].sort(),
    );
  });

  it('accepts an injected eventBus and now()', async () => {
    const eventBus = createSalesEventBus();
    const fixedNow = '2024-01-01T00:00:00.000Z';
    const runtime = createSalesRuntime({ eventBus, now: () => fixedNow });

    expect(runtime.events).toBe(eventBus);
    const opportunity = await runtime.opportunities.create('org-1', { name: 'Acme Corp' });
    expect(opportunity.createdAt).toBe(fixedNow);
  });

  it('is fully usable offline with zero injected collaborators', async () => {
    const runtime = createSalesRuntime();
    const opportunity = await runtime.opportunities.create('org-1', { name: 'Acme Corp' });
    const context = await runtime.relationships.getCustomerContext('org-1', 'customer-1');
    expect(context).toBeNull();
    const listPrice = await runtime.pricing.getListPrice('org-1', 'product-1');
    expect(listPrice).toBeNull();
    const task = await runtime.tasks.generateTask('org-1', { taskType: 'follow_up_reminder', opportunityId: opportunity.id });
    expect(task.workflowInstanceId).toBeUndefined();
  });

  it('runtime instances are independent — no shared module-level state', async () => {
    const runtimeA = createSalesRuntime();
    const runtimeB = createSalesRuntime();
    await runtimeA.opportunities.create('org-1', { name: 'Acme Corp' });

    const result = await runtimeB.queries.findOpportunities({ organizationId: 'org-1' });
    expect(result.total).toBe(0);
  });

  it('forecast and metrics read from the same opportunity data as the pipeline', async () => {
    const runtime = createSalesRuntime();
    const opportunity = await runtime.opportunities.create('org-1', { name: 'Acme Corp', amount: '1000.00' });
    await runtime.opportunities.qualify('org-1', opportunity.id);

    const forecast = await runtime.forecast.generateForecast('org-1');
    const metrics = await runtime.metrics.getMetrics('org-1');
    expect(forecast.opportunityCount).toBe(1);
    expect(metrics.openCount).toBe(1);
  });
});
