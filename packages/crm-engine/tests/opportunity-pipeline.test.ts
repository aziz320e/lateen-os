import { describe, expect, it, vi } from 'vitest';
import { createOpportunityRepository } from '../src/opportunity/repository.impl.js';
import { canTransitionDealStage, createOpportunityPipeline } from '../src/opportunity/pipeline.impl.js';
import { createCrmEventBus } from '../src/events/crm-event-bus.js';
import { InvalidDealStageTransitionError, OpportunityNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createCrmEventBus()) {
  const repository = createOpportunityRepository();
  const pipeline = createOpportunityPipeline(repository, eventBus);
  return { repository, pipeline, eventBus };
}

describe('canTransitionDealStage', () => {
  it('walks the full deterministic pipeline', () => {
    expect(canTransitionDealStage('new', 'qualified')).toBe(true);
    expect(canTransitionDealStage('qualified', 'proposal')).toBe(true);
    expect(canTransitionDealStage('proposal', 'negotiation')).toBe(true);
    expect(canTransitionDealStage('negotiation', 'won')).toBe(true);
  });

  it('allows losing from any open stage', () => {
    expect(canTransitionDealStage('new', 'lost')).toBe(true);
    expect(canTransitionDealStage('qualified', 'lost')).toBe(true);
    expect(canTransitionDealStage('proposal', 'lost')).toBe(true);
    expect(canTransitionDealStage('negotiation', 'lost')).toBe(true);
  });

  it('forbids skipping stages and leaving won/lost', () => {
    expect(canTransitionDealStage('new', 'negotiation')).toBe(false);
    expect(canTransitionDealStage('won', 'lost')).toBe(false);
    expect(canTransitionDealStage('lost', 'new')).toBe(false);
  });
});

describe('createOpportunityPipeline', () => {
  it('create() creates a new-stage opportunity', async () => {
    const { pipeline } = setup();
    const opportunity = await pipeline.create(ORG, { name: 'Acme — Annual Contract' });
    expect(opportunity.stage).toBe('new');
    expect(opportunity.tags).toEqual([]);
  });

  it('update() merges fields on an open opportunity', async () => {
    const { pipeline } = setup();
    const opportunity = await pipeline.create(ORG, { name: 'Acme — Annual Contract' });
    const updated = await pipeline.update(ORG, opportunity.id, { amount: '50000.00', currency: 'USD' });
    expect(updated.amount).toBe('50000.00');
    expect(updated.currency).toBe('USD');
  });

  it('update() rejects a closed (won) opportunity', async () => {
    const { pipeline } = setup();
    const opportunity = await pipeline.create(ORG, { name: 'Acme — Annual Contract' });
    await pipeline.advanceStage(ORG, opportunity.id, 'qualified');
    await pipeline.advanceStage(ORG, opportunity.id, 'proposal');
    await pipeline.advanceStage(ORG, opportunity.id, 'negotiation');
    await pipeline.win(ORG, opportunity.id);
    await expect(pipeline.update(ORG, opportunity.id, { amount: '1' })).rejects.toBeInstanceOf(InvalidDealStageTransitionError);
  });

  it('advanceStage() rejects an illegal jump', async () => {
    const { pipeline } = setup();
    const opportunity = await pipeline.create(ORG, { name: 'Acme — Annual Contract' });
    await expect(pipeline.advanceStage(ORG, opportunity.id, 'negotiation')).rejects.toBeInstanceOf(InvalidDealStageTransitionError);
  });

  it('advanceStage() stamps closedAt only when moving to won/lost', async () => {
    const { pipeline } = setup();
    const opportunity = await pipeline.create(ORG, { name: 'Acme — Annual Contract' });
    const qualified = await pipeline.advanceStage(ORG, opportunity.id, 'qualified');
    expect(qualified.closedAt).toBeUndefined();
    const lost = await pipeline.advanceStage(ORG, opportunity.id, 'lost');
    expect(lost.closedAt).toBeDefined();
  });

  it('win() advances to won, optionally overriding amount', async () => {
    const { pipeline } = setup();
    const opportunity = await pipeline.create(ORG, { name: 'Acme — Annual Contract', amount: '1000.00' });
    await pipeline.advanceStage(ORG, opportunity.id, 'qualified');
    await pipeline.advanceStage(ORG, opportunity.id, 'proposal');
    await pipeline.advanceStage(ORG, opportunity.id, 'negotiation');
    const won = await pipeline.win(ORG, opportunity.id, '1200.00');
    expect(won.stage).toBe('won');
    expect(won.amount).toBe('1200.00');
  });

  it('lose() advances to lost and records the reason', async () => {
    const { pipeline } = setup();
    const opportunity = await pipeline.create(ORG, { name: 'Acme — Annual Contract' });
    const lost = await pipeline.lose(ORG, opportunity.id, 'Budget cut');
    expect(lost.stage).toBe('lost');
    expect(lost.lostReason).toBe('Budget cut');
  });

  it('throws OpportunityNotFoundError for unknown opportunity', async () => {
    const { pipeline } = setup();
    await expect(pipeline.advanceStage(ORG, 'missing', 'qualified')).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it('publishes opportunity.created, opportunity.won, and opportunity.lost', async () => {
    const eventBus = createCrmEventBus();
    const created = vi.fn();
    const won = vi.fn();
    const lost = vi.fn();
    eventBus.subscribe('opportunity.created', created);
    eventBus.subscribe('opportunity.won', won);
    eventBus.subscribe('opportunity.lost', lost);

    const { pipeline } = setup(eventBus);
    const opp1 = await pipeline.create(ORG, { name: 'Deal 1' });
    await pipeline.advanceStage(ORG, opp1.id, 'qualified');
    await pipeline.advanceStage(ORG, opp1.id, 'proposal');
    await pipeline.advanceStage(ORG, opp1.id, 'negotiation');
    await pipeline.win(ORG, opp1.id);

    const opp2 = await pipeline.create(ORG, { name: 'Deal 2' });
    await pipeline.lose(ORG, opp2.id);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(2);
    expect(won).toHaveBeenCalledTimes(1);
    expect(lost).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, pipeline } = setup();
    const opportunity = await pipeline.create(ORG, { name: 'Acme — Annual Contract' });
    expect(await repository.findById('org-2', opportunity.id)).toBeNull();
  });

  it('get() returns null for an unknown opportunity', async () => {
    const { pipeline } = setup();
    expect(await pipeline.get(ORG, 'missing')).toBeNull();
  });

  it('update() rejects a closed (lost) opportunity', async () => {
    const { pipeline } = setup();
    const opportunity = await pipeline.create(ORG, { name: 'Acme — Annual Contract' });
    await pipeline.lose(ORG, opportunity.id);
    await expect(pipeline.update(ORG, opportunity.id, { amount: '1' })).rejects.toBeInstanceOf(InvalidDealStageTransitionError);
  });
});
