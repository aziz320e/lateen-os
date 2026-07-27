import { describe, expect, it } from 'vitest';
import { createCrmRuntime } from '../src/runtime.js';
import { createCrmEventBus } from '../src/events/crm-event-bus.js';

describe('createCrmRuntime', () => {
  it('exposes only services, queries, and the event bus — never repositories', () => {
    const runtime = createCrmRuntime();
    expect(Object.keys(runtime).sort()).toEqual(
      ['customers', 'leads', 'contacts', 'accounts', 'opportunities', 'activities', 'duplicates', 'relationships', 'queries', 'events'].sort(),
    );
  });

  it('accepts an injected eventBus and now()', async () => {
    const eventBus = createCrmEventBus();
    const fixedNow = '2024-01-01T00:00:00.000Z';
    const runtime = createCrmRuntime({ eventBus, now: () => fixedNow });

    expect(runtime.events).toBe(eventBus);
    const customer = await runtime.customers.create('org-1', { name: 'Acme Corp' });
    expect(customer.createdAt).toBe(fixedNow);
  });

  it('is fully usable offline with zero injected collaborators', async () => {
    const runtime = createCrmRuntime();
    const customer = await runtime.customers.create('org-1', { name: 'Acme Corp' });
    const relationshipResult = await runtime.relationships.syncCustomerToGraph('org-1', 'graph-1', customer);
    expect(relationshipResult).toBeNull();
  });

  it('wires leads.convert() to compose the real customers.create()', async () => {
    const runtime = createCrmRuntime();
    const lead = await runtime.leads.create('org-1', { name: 'Jordan Lee' });
    await runtime.leads.qualify('org-1', lead.id);
    const { customer } = await runtime.leads.convert('org-1', lead.id);

    const persisted = await runtime.customers.get('org-1', customer.id);
    expect(persisted).not.toBeNull();
    expect(persisted?.sourceLeadId).toBe(lead.id);
  });

  it('runtime instances are independent — no shared module-level state', async () => {
    const runtimeA = createCrmRuntime();
    const runtimeB = createCrmRuntime();
    await runtimeA.customers.create('org-1', { name: 'Acme Corp' });

    const result = await runtimeB.queries.findCustomers({ organizationId: 'org-1' });
    expect(result.total).toBe(0);
  });
});
