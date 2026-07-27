import { describe, expect, it, vi } from 'vitest';
import { createSalesEventBus } from '../src/events/sales-event-bus.js';
import { SALES_EVENT_NAMES } from '../src/events/sales-events.js';
import { createSalesRuntime } from '../src/runtime.js';

describe('SALES_EVENT_NAMES', () => {
  it('declares exactly the 9 required event names', () => {
    expect(Object.values(SALES_EVENT_NAMES).sort()).toEqual(
      [
        'opportunity.created',
        'opportunity.qualified',
        'proposal.created',
        'proposal.approved',
        'negotiation.started',
        'deal.won',
        'deal.lost',
        'quote.created',
        'forecast.updated',
      ].sort(),
    );
  });
});

describe('createSalesEventBus', () => {
  it('dispatches to subscribers of the exact event name only', () => {
    const eventBus = createSalesEventBus();
    const opportunityCreated = vi.fn();
    const quoteCreated = vi.fn();
    eventBus.subscribe('opportunity.created', opportunityCreated);
    eventBus.subscribe('quote.created', quoteCreated);

    eventBus.publish('opportunity.created', { opportunityId: 'opp-1', organizationId: 'org-1', name: 'Acme Corp' });

    expect(opportunityCreated).toHaveBeenCalledTimes(1);
    expect(quoteCreated).not.toHaveBeenCalled();
  });
});

describe('end-to-end event flow through createSalesRuntime()', () => {
  it('every declared event is genuinely published by the real service that causes it', async () => {
    const runtime = createSalesRuntime();
    const seen: string[] = [];
    for (const eventName of Object.values(SALES_EVENT_NAMES)) {
      runtime.events.subscribe(eventName, () => seen.push(eventName));
    }

    const ORG = 'org-1';
    const opportunity = await runtime.opportunities.create(ORG, { name: 'Acme Corp — Deal', amount: '5000.00' });
    await runtime.opportunities.qualify(ORG, opportunity.id);
    await runtime.opportunities.propose(ORG, opportunity.id);
    await runtime.opportunities.negotiate(ORG, opportunity.id);
    await runtime.opportunities.closeWon(ORG, opportunity.id);

    const otherOpportunity = await runtime.opportunities.create(ORG, { name: 'Globex — Deal' });
    await runtime.opportunities.closeLost(ORG, otherOpportunity.id);

    await runtime.quotes.createQuote(ORG, { title: 'Acme Corp — Quote', currency: 'USD', lineItems: [] });

    const task = await runtime.tasks.generateTask(ORG, { taskType: 'proposal_approval', opportunityId: opportunity.id });
    await runtime.tasks.completeTask(ORG, task.id, { approved: true });

    await runtime.forecast.generateForecast(ORG);
    await Promise.resolve();

    expect(new Set(seen)).toEqual(new Set(Object.values(SALES_EVENT_NAMES)));
  });
});
