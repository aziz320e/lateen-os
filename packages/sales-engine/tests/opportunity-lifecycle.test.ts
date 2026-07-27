import { describe, expect, it, vi } from 'vitest';
import { createSalesOpportunityRepository } from '../src/opportunity/repository.impl.js';
import { canTransitionSalesStage, createSalesOpportunityLifecycle } from '../src/opportunity/lifecycle.impl.js';
import { createSalesEventBus } from '../src/events/sales-event-bus.js';
import { InvalidSalesStageTransitionError, SalesOpportunityNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createSalesEventBus()) {
  const repository = createSalesOpportunityRepository();
  const lifecycle = createSalesOpportunityLifecycle(repository, eventBus);
  return { repository, lifecycle, eventBus };
}

describe('canTransitionSalesStage', () => {
  it('allows the full happy-path pipeline walk', () => {
    expect(canTransitionSalesStage('new', 'discovery')).toBe(true);
    expect(canTransitionSalesStage('new', 'qualified')).toBe(true);
    expect(canTransitionSalesStage('discovery', 'qualified')).toBe(true);
    expect(canTransitionSalesStage('qualified', 'proposal')).toBe(true);
    expect(canTransitionSalesStage('proposal', 'negotiation')).toBe(true);
    expect(canTransitionSalesStage('negotiation', 'verbal_commit')).toBe(true);
    expect(canTransitionSalesStage('negotiation', 'won')).toBe(true);
    expect(canTransitionSalesStage('verbal_commit', 'won')).toBe(true);
  });

  it('allows losing from any open stage', () => {
    for (const stage of ['new', 'discovery', 'qualified', 'proposal', 'negotiation', 'verbal_commit'] as const) {
      expect(canTransitionSalesStage(stage, 'lost')).toBe(true);
    }
  });

  it('forbids skipping stages and leaving won/lost', () => {
    expect(canTransitionSalesStage('new', 'negotiation')).toBe(false);
    expect(canTransitionSalesStage('discovery', 'won')).toBe(false);
    expect(canTransitionSalesStage('won', 'lost')).toBe(false);
    expect(canTransitionSalesStage('lost', 'new')).toBe(false);
  });
});

describe('createSalesOpportunityLifecycle', () => {
  it('create() creates a new-stage, active opportunity', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp — Annual Contract' });
    expect(opportunity.stage).toBe('new');
    expect(opportunity.status).toBe('active');
    expect(opportunity.tags).toEqual([]);
  });

  it('update() merges fields on an active opportunity', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    const updated = await lifecycle.update(ORG, opportunity.id, { amount: '50000.00', currency: 'USD' });
    expect(updated.amount).toBe('50000.00');
    expect(updated.currency).toBe('USD');
    expect(updated.name).toBe('Acme Corp');
  });

  it('update() rejects an archived opportunity', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.archive(ORG, opportunity.id);
    await expect(lifecycle.update(ORG, opportunity.id, { name: 'X' })).rejects.toBeInstanceOf(InvalidSalesStageTransitionError);
  });

  it('advanceStage() moves through discovery directly', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    const discovering = await lifecycle.advanceStage(ORG, opportunity.id, 'discovery');
    expect(discovering.stage).toBe('discovery');
  });

  it('advanceStage() rejects an illegal jump', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await expect(lifecycle.advanceStage(ORG, opportunity.id, 'negotiation')).rejects.toBeInstanceOf(InvalidSalesStageTransitionError);
  });

  it('qualify() advances new -> qualified', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    const qualified = await lifecycle.qualify(ORG, opportunity.id);
    expect(qualified.stage).toBe('qualified');
  });

  it('qualify() advances discovery -> qualified', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.advanceStage(ORG, opportunity.id, 'discovery');
    const qualified = await lifecycle.qualify(ORG, opportunity.id);
    expect(qualified.stage).toBe('qualified');
  });

  it('propose() advances qualified -> proposal', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.qualify(ORG, opportunity.id);
    const proposed = await lifecycle.propose(ORG, opportunity.id);
    expect(proposed.stage).toBe('proposal');
  });

  it('propose() rejects from new', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await expect(lifecycle.propose(ORG, opportunity.id)).rejects.toBeInstanceOf(InvalidSalesStageTransitionError);
  });

  it('negotiate() advances proposal -> negotiation', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.qualify(ORG, opportunity.id);
    await lifecycle.propose(ORG, opportunity.id);
    const negotiating = await lifecycle.negotiate(ORG, opportunity.id);
    expect(negotiating.stage).toBe('negotiation');
  });

  it('closeWon() advances negotiation -> won, stamping closedAt and previousStage', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.qualify(ORG, opportunity.id);
    await lifecycle.propose(ORG, opportunity.id);
    await lifecycle.negotiate(ORG, opportunity.id);
    const won = await lifecycle.closeWon(ORG, opportunity.id);
    expect(won.stage).toBe('won');
    expect(won.previousStage).toBe('negotiation');
    expect(won.closedAt).toBeDefined();
  });

  it('closeWon() advances verbal_commit -> won and can override the amount', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp', amount: '1000.00' });
    await lifecycle.qualify(ORG, opportunity.id);
    await lifecycle.propose(ORG, opportunity.id);
    await lifecycle.negotiate(ORG, opportunity.id);
    await lifecycle.advanceStage(ORG, opportunity.id, 'verbal_commit');
    const won = await lifecycle.closeWon(ORG, opportunity.id, '1200.00');
    expect(won.stage).toBe('won');
    expect(won.amount).toBe('1200.00');
  });

  it('closeLost() records the reason and stamps previousStage', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.qualify(ORG, opportunity.id);
    const lost = await lifecycle.closeLost(ORG, opportunity.id, 'Budget cut');
    expect(lost.stage).toBe('lost');
    expect(lost.lostReason).toBe('Budget cut');
    expect(lost.previousStage).toBe('qualified');
  });

  it('reopen() restores the stage the opportunity was lost from', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.qualify(ORG, opportunity.id);
    await lifecycle.propose(ORG, opportunity.id);
    await lifecycle.negotiate(ORG, opportunity.id);
    await lifecycle.closeLost(ORG, opportunity.id, 'Not now');

    const reopened = await lifecycle.reopen(ORG, opportunity.id);
    expect(reopened.stage).toBe('negotiation');
    expect(reopened.lostReason).toBeUndefined();
    expect(reopened.closedAt).toBeUndefined();
  });

  it('reopen() falls back to negotiation when no previousStage is recorded', async () => {
    const { repository, lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await repository.save({ ...opportunity, stage: 'lost' });
    const reopened = await lifecycle.reopen(ORG, opportunity.id);
    expect(reopened.stage).toBe('negotiation');
  });

  it('reopen() rejects a won opportunity', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.qualify(ORG, opportunity.id);
    await lifecycle.propose(ORG, opportunity.id);
    await lifecycle.negotiate(ORG, opportunity.id);
    await lifecycle.closeWon(ORG, opportunity.id);
    await expect(lifecycle.reopen(ORG, opportunity.id)).rejects.toBeInstanceOf(InvalidSalesStageTransitionError);
  });

  it('reopen() rejects an opportunity that is not lost', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await expect(lifecycle.reopen(ORG, opportunity.id)).rejects.toBeInstanceOf(InvalidSalesStageTransitionError);
  });

  it('archive() sets status archived independent of stage', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    const archived = await lifecycle.archive(ORG, opportunity.id);
    expect(archived.status).toBe('archived');
  });

  it('archive() rejects an already-archived opportunity', async () => {
    const { lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    await lifecycle.archive(ORG, opportunity.id);
    await expect(lifecycle.archive(ORG, opportunity.id)).rejects.toBeInstanceOf(InvalidSalesStageTransitionError);
  });

  it('throws SalesOpportunityNotFoundError for an unknown opportunity', async () => {
    const { lifecycle } = setup();
    await expect(lifecycle.qualify(ORG, 'missing')).rejects.toBeInstanceOf(SalesOpportunityNotFoundError);
  });

  it('get() returns null for an unknown opportunity', async () => {
    const { lifecycle } = setup();
    expect(await lifecycle.get(ORG, 'missing')).toBeNull();
  });

  it('publishes opportunity.created, opportunity.qualified, proposal.created, negotiation.started, deal.won, and deal.lost', async () => {
    const eventBus = createSalesEventBus();
    const created = vi.fn();
    const qualified = vi.fn();
    const proposed = vi.fn();
    const negotiating = vi.fn();
    const won = vi.fn();
    const lost = vi.fn();
    eventBus.subscribe('opportunity.created', created);
    eventBus.subscribe('opportunity.qualified', qualified);
    eventBus.subscribe('proposal.created', proposed);
    eventBus.subscribe('negotiation.started', negotiating);
    eventBus.subscribe('deal.won', won);
    eventBus.subscribe('deal.lost', lost);

    const { lifecycle } = setup(eventBus);
    const opp1 = await lifecycle.create(ORG, { name: 'Deal 1' });
    await lifecycle.qualify(ORG, opp1.id);
    await lifecycle.propose(ORG, opp1.id);
    await lifecycle.negotiate(ORG, opp1.id);
    await lifecycle.closeWon(ORG, opp1.id);

    const opp2 = await lifecycle.create(ORG, { name: 'Deal 2' });
    await lifecycle.closeLost(ORG, opp2.id);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(2);
    expect(qualified).toHaveBeenCalledTimes(1);
    expect(proposed).toHaveBeenCalledTimes(1);
    expect(negotiating).toHaveBeenCalledTimes(1);
    expect(won).toHaveBeenCalledTimes(1);
    expect(lost).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, lifecycle } = setup();
    const opportunity = await lifecycle.create(ORG, { name: 'Acme Corp' });
    expect(await repository.findById('org-2', opportunity.id)).toBeNull();
  });
});
