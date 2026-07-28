import { describe, expect, it } from 'vitest';
import { canTransitionExpansion, createExpansionEngine } from '../src/expansion/engine.impl.js';
import { createExpansionOpportunityRepository } from '../src/expansion/repository.impl.js';
import { ExpansionOpportunityNotFoundError, InvalidExpansionTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  return { engine: createExpansionEngine(createExpansionOpportunityRepository()) };
}

describe('canTransitionExpansion (pure)', () => {
  it('identified -> proposed | lost', () => {
    expect(canTransitionExpansion('identified', 'proposed')).toBe(true);
    expect(canTransitionExpansion('identified', 'lost')).toBe(true);
    expect(canTransitionExpansion('identified', 'won')).toBe(false);
  });

  it('proposed -> won | lost', () => {
    expect(canTransitionExpansion('proposed', 'won')).toBe(true);
    expect(canTransitionExpansion('proposed', 'lost')).toBe(true);
  });

  it('won and lost are terminal', () => {
    expect(canTransitionExpansion('won', 'proposed')).toBe(false);
    expect(canTransitionExpansion('lost', 'proposed')).toBe(false);
  });
});

describe('ExpansionEngine', () => {
  it('identify() starts an upsell opportunity at identified status', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    expect(opportunity.status).toBe('identified');
    expect(opportunity.opportunityType).toBe('upsell');
  });

  it('identify() supports cross_sell with description, estimatedValue, and currency', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, {
      customerId: 'customer-1',
      opportunityType: 'cross_sell',
      description: 'Add analytics module',
      estimatedValue: '5000.00',
      currency: 'USD',
    });
    expect(opportunity.opportunityType).toBe('cross_sell');
    expect(opportunity.description).toBe('Add analytics module');
    expect(opportunity.estimatedValue).toBe('5000.00');
  });

  it('propose() moves identified -> proposed', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    const proposed = await engine.propose(ORG, opportunity.id);
    expect(proposed.status).toBe('proposed');
  });

  it('win() and lose() transition from proposed', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    await engine.propose(ORG, opportunity.id);
    const won = await engine.win(ORG, opportunity.id);
    expect(won.status).toBe('won');

    const other = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'cross_sell' });
    await engine.propose(ORG, other.id);
    const lost = await engine.lose(ORG, other.id);
    expect(lost.status).toBe('lost');
  });

  it('lose() is also reachable directly from identified', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    const lost = await engine.lose(ORG, opportunity.id);
    expect(lost.status).toBe('lost');
  });

  it('rejects an invalid transition (identified -> won directly)', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    await expect(engine.win(ORG, opportunity.id)).rejects.toBeInstanceOf(InvalidExpansionTransitionError);
  });

  it('linkSalesOpportunity() records a real Sales Engine opportunity foreign key', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    const linked = await engine.linkSalesOpportunity(ORG, opportunity.id, 'sales-opportunity-1');
    expect(linked.linkedSalesOpportunityId).toBe('sales-opportunity-1');
  });

  it('propose()/linkSalesOpportunity() throw ExpansionOpportunityNotFoundError for an unknown opportunity', async () => {
    const { engine } = setup();
    await expect(engine.propose(ORG, 'missing')).rejects.toBeInstanceOf(ExpansionOpportunityNotFoundError);
    await expect(engine.linkSalesOpportunity(ORG, 'missing', 'sales-1')).rejects.toBeInstanceOf(ExpansionOpportunityNotFoundError);
  });

  it('findByCustomer / findByType / findByStatus filter correctly', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    await engine.identify(ORG, { customerId: 'customer-2', opportunityType: 'cross_sell' });

    expect(await engine.findByCustomer(ORG, 'customer-1')).toEqual([opportunity]);
    expect(await engine.findByType(ORG, 'upsell')).toEqual([opportunity]);
    expect(await engine.findByStatus(ORG, 'identified')).toHaveLength(2);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    expect(await engine.get(ORG, opportunity.id)).toEqual(opportunity);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('opportunities are isolated per organization', async () => {
    const { engine } = setup();
    await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    await engine.identify('org-2', { customerId: 'customer-1', opportunityType: 'upsell' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('win()/lose() throw ExpansionOpportunityNotFoundError for an unknown opportunity', async () => {
    const { engine } = setup();
    await expect(engine.win(ORG, 'missing')).rejects.toBeInstanceOf(ExpansionOpportunityNotFoundError);
    await expect(engine.lose(ORG, 'missing')).rejects.toBeInstanceOf(ExpansionOpportunityNotFoundError);
  });

  it('rejects win() called on an already-won opportunity', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    await engine.propose(ORG, opportunity.id);
    await engine.win(ORG, opportunity.id);
    await expect(engine.win(ORG, opportunity.id)).rejects.toBeInstanceOf(InvalidExpansionTransitionError);
  });

  it('rejects propose() called on an already-proposed opportunity', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    await engine.propose(ORG, opportunity.id);
    await expect(engine.propose(ORG, opportunity.id)).rejects.toBeInstanceOf(InvalidExpansionTransitionError);
  });

  it('list() returns an empty array for an organization with no opportunities', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('findByType() returns an empty array when no opportunity matches', async () => {
    const { engine } = setup();
    await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    expect(await engine.findByType(ORG, 'cross_sell')).toEqual([]);
  });

  it('linkSalesOpportunity() can be called on an opportunity in any status', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    await engine.propose(ORG, opportunity.id);
    await engine.win(ORG, opportunity.id);
    const linked = await engine.linkSalesOpportunity(ORG, opportunity.id, 'sales-opp-1');
    expect(linked.linkedSalesOpportunityId).toBe('sales-opp-1');
    expect(linked.status).toBe('won');
  });

  it('identify() without a description/estimatedValue leaves them undefined', async () => {
    const { engine } = setup();
    const opportunity = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    expect(opportunity.description).toBeUndefined();
    expect(opportunity.estimatedValue).toBeUndefined();
  });

  it('a customer can have both upsell and cross_sell opportunities simultaneously', async () => {
    const { engine } = setup();
    await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'cross_sell' });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toHaveLength(2);
  });

  it('losing one opportunity does not affect another for the same customer', async () => {
    const { engine } = setup();
    const first = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'upsell' });
    const second = await engine.identify(ORG, { customerId: 'customer-1', opportunityType: 'cross_sell' });
    await engine.lose(ORG, first.id);
    const reloadedSecond = await engine.get(ORG, second.id);
    expect(reloadedSecond?.status).toBe('identified');
  });
});
