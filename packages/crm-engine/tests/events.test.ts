import { describe, expect, it, vi } from 'vitest';
import { createCrmEventBus } from '../src/events/crm-event-bus.js';
import { CRM_EVENT_NAMES } from '../src/events/crm-events.js';
import { createCrmRuntime } from '../src/runtime.js';

describe('CRM_EVENT_NAMES', () => {
  it('declares exactly the 9 required event names', () => {
    expect(Object.values(CRM_EVENT_NAMES).sort()).toEqual(
      [
        'lead.created',
        'lead.qualified',
        'lead.converted',
        'customer.created',
        'customer.updated',
        'opportunity.created',
        'opportunity.won',
        'opportunity.lost',
        'activity.logged',
      ].sort(),
    );
  });
});

describe('createCrmEventBus', () => {
  it('dispatches to subscribers of the exact event name only', () => {
    const eventBus = createCrmEventBus();
    const leadCreated = vi.fn();
    const customerCreated = vi.fn();
    eventBus.subscribe('lead.created', leadCreated);
    eventBus.subscribe('customer.created', customerCreated);

    eventBus.publish('lead.created', { leadId: 'lead-1', organizationId: 'org-1', name: 'Jordan Lee' });

    expect(leadCreated).toHaveBeenCalledTimes(1);
    expect(customerCreated).not.toHaveBeenCalled();
  });
});

describe('end-to-end event flow through createCrmRuntime()', () => {
  it('every declared event is genuinely published by the real service that causes it', async () => {
    const runtime = createCrmRuntime();
    const seen: string[] = [];
    for (const eventName of Object.values(CRM_EVENT_NAMES)) {
      runtime.events.subscribe(eventName, () => seen.push(eventName));
    }

    const ORG = 'org-1';
    const lead = await runtime.leads.create(ORG, { name: 'Jordan Lee' });
    await runtime.leads.qualify(ORG, lead.id);
    const { customer } = await runtime.leads.convert(ORG, lead.id);
    await runtime.customers.update(ORG, customer.id, { company: 'Acme Corp' });

    const opportunity = await runtime.opportunities.create(ORG, { name: 'Acme — Deal', customerId: customer.id });
    await runtime.opportunities.advanceStage(ORG, opportunity.id, 'qualified');
    await runtime.opportunities.advanceStage(ORG, opportunity.id, 'proposal');
    await runtime.opportunities.advanceStage(ORG, opportunity.id, 'negotiation');
    await runtime.opportunities.win(ORG, opportunity.id);

    const otherOpportunity = await runtime.opportunities.create(ORG, { name: 'Globex — Deal' });
    await runtime.opportunities.lose(ORG, otherOpportunity.id);

    await runtime.activities.log(ORG, { activityType: 'call', subject: 'Kickoff', relatedTo: { entityType: 'customer', entityId: customer.id } });
    await Promise.resolve();

    expect(new Set(seen)).toEqual(new Set(Object.values(CRM_EVENT_NAMES)));
  });
});
