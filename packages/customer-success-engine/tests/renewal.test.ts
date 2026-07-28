import { describe, expect, it } from 'vitest';
import { createCustomerSuccessEventBus } from '../src/events/index.js';
import { canTransitionRenewal, createRenewalEngine } from '../src/renewal/engine.impl.js';
import { createRenewalRepository } from '../src/renewal/repository.impl.js';
import { InvalidRenewalTransitionError, RenewalNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createCustomerSuccessEventBus();
  const engine = createRenewalEngine(createRenewalRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionRenewal (pure)', () => {
  it('pipeline -> reminder_sent | at_risk | won | lost', () => {
    expect(canTransitionRenewal('pipeline', 'reminder_sent')).toBe(true);
    expect(canTransitionRenewal('pipeline', 'at_risk')).toBe(true);
    expect(canTransitionRenewal('pipeline', 'won')).toBe(true);
    expect(canTransitionRenewal('pipeline', 'lost')).toBe(true);
  });

  it('reminder_sent -> at_risk | won | lost', () => {
    expect(canTransitionRenewal('reminder_sent', 'at_risk')).toBe(true);
    expect(canTransitionRenewal('reminder_sent', 'won')).toBe(true);
  });

  it('at_risk -> won | lost', () => {
    expect(canTransitionRenewal('at_risk', 'won')).toBe(true);
    expect(canTransitionRenewal('at_risk', 'lost')).toBe(true);
  });

  it('won and lost are terminal', () => {
    expect(canTransitionRenewal('won', 'at_risk')).toBe(false);
    expect(canTransitionRenewal('lost', 'at_risk')).toBe(false);
  });
});

describe('RenewalEngine', () => {
  it('createRenewal() starts at pipeline status with a default 50% probability', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    expect(renewal.status).toBe('pipeline');
    expect(renewal.probability).toBe(50);
  });

  it('publishes renewal.created', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('renewal.created', (payload) => (seen = payload));
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    expect(seen).toEqual({ organizationId: ORG, renewalId: renewal.id, customerId: 'customer-1', renewalDate: '2026-06-01' });
  });

  it('createRenewal() accepts an explicit probability, amount, and currency', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01', probability: 80, amount: '12000.00', currency: 'USD' });
    expect(renewal.probability).toBe(80);
    expect(renewal.amount).toBe('12000.00');
    expect(renewal.currency).toBe('USD');
  });

  it('sendReminder() appends a reminder and transitions pipeline -> reminder_sent', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const reminded = await engine.sendReminder(ORG, renewal.id, { channel: 'email' });
    expect(reminded.status).toBe('reminder_sent');
    expect(reminded.reminders).toHaveLength(1);
    expect(reminded.reminders[0]?.channel).toBe('email');
  });

  it('sendReminder() can be called multiple times, appending each time', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    await engine.sendReminder(ORG, renewal.id);
    const twice = await engine.sendReminder(ORG, renewal.id);
    expect(twice.reminders).toHaveLength(2);
    expect(twice.status).toBe('reminder_sent');
  });

  it('markAtRisk() transitions to at_risk', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const atRisk = await engine.markAtRisk(ORG, renewal.id);
    expect(atRisk.status).toBe('at_risk');
  });

  it('updateProbability() changes the probability without affecting status', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const updated = await engine.updateProbability(ORG, renewal.id, 90);
    expect(updated.probability).toBe(90);
    expect(updated.status).toBe('pipeline');
  });

  it('complete() with outcome "won" publishes renewal.completed', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('renewal.completed', (payload) => (seen = payload));
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const completed = await engine.complete(ORG, renewal.id, 'won');
    expect(completed.status).toBe('won');
    expect(seen).toEqual({ organizationId: ORG, renewalId: renewal.id, customerId: 'customer-1', outcome: 'won' });
  });

  it('complete() with outcome "lost" transitions to lost', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const completed = await engine.complete(ORG, renewal.id, 'lost');
    expect(completed.status).toBe('lost');
  });

  it('rejects an invalid transition (won -> at_risk)', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    await engine.complete(ORG, renewal.id, 'won');
    await expect(engine.markAtRisk(ORG, renewal.id)).rejects.toBeInstanceOf(InvalidRenewalTransitionError);
  });

  it('markAtRisk()/complete() throw RenewalNotFoundError for an unknown renewal', async () => {
    const { engine } = setup();
    await expect(engine.markAtRisk(ORG, 'missing')).rejects.toBeInstanceOf(RenewalNotFoundError);
    await expect(engine.complete(ORG, 'missing', 'won')).rejects.toBeInstanceOf(RenewalNotFoundError);
  });

  it('findByCustomer / findByStatus filter correctly', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    await engine.createRenewal(ORG, { customerId: 'customer-2', renewalDate: '2026-07-01' });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toEqual([renewal]);
    expect(await engine.findByStatus(ORG, 'pipeline')).toHaveLength(2);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    expect(await engine.get(ORG, renewal.id)).toEqual(renewal);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('renewals are isolated per organization', async () => {
    const { engine } = setup();
    await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    await engine.createRenewal('org-2', { customerId: 'customer-1', renewalDate: '2026-06-01' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('sendReminder() does not change status once already reminder_sent, only appends a new reminder', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    await engine.sendReminder(ORG, renewal.id, { channel: 'email' });
    const second = await engine.sendReminder(ORG, renewal.id, { channel: 'sms' });
    expect(second.status).toBe('reminder_sent');
    expect(second.reminders.map((r) => r.channel)).toEqual(['email', 'sms']);
  });

  it('sendReminder() works from at_risk without changing status', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    await engine.markAtRisk(ORG, renewal.id);
    const reminded = await engine.sendReminder(ORG, renewal.id);
    expect(reminded.status).toBe('at_risk');
    expect(reminded.reminders).toHaveLength(1);
  });

  it('sendReminder() throws RenewalNotFoundError for an unknown renewal', async () => {
    const { engine } = setup();
    await expect(engine.sendReminder(ORG, 'missing')).rejects.toBeInstanceOf(RenewalNotFoundError);
  });

  it('updateProbability() throws RenewalNotFoundError for an unknown renewal', async () => {
    const { engine } = setup();
    await expect(engine.updateProbability(ORG, 'missing', 50)).rejects.toBeInstanceOf(RenewalNotFoundError);
  });

  it('reminder_sent -> at_risk -> won is a valid full path', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    await engine.sendReminder(ORG, renewal.id);
    await engine.markAtRisk(ORG, renewal.id);
    const won = await engine.complete(ORG, renewal.id, 'won');
    expect(won.status).toBe('won');
  });

  it('rejects markAtRisk() called on a won renewal', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    await engine.complete(ORG, renewal.id, 'won');
    await expect(engine.markAtRisk(ORG, renewal.id)).rejects.toBeInstanceOf(InvalidRenewalTransitionError);
  });

  it('list() returns an empty array for an organization with no renewals', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('findByStatus() returns an empty array when no renewal matches', async () => {
    const { engine } = setup();
    await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    expect(await engine.findByStatus(ORG, 'lost')).toEqual([]);
  });

  it('createRenewal() with no amount/currency leaves them undefined', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    expect(renewal.amount).toBeUndefined();
    expect(renewal.currency).toBeUndefined();
  });

  it('a customer can have multiple renewals over time', async () => {
    const { engine } = setup();
    const first = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2025-06-01' });
    await engine.complete(ORG, first.id, 'won');
    const second = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    expect(await engine.findByCustomer(ORG, 'customer-1')).toHaveLength(2);
    expect(second.status).toBe('pipeline');
  });

  it('sendReminder() records no channel when none is given', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const reminded = await engine.sendReminder(ORG, renewal.id);
    expect(reminded.reminders[0]?.channel).toBeUndefined();
  });

  it('updateProbability() to 0 and 100 are both valid', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const zero = await engine.updateProbability(ORG, renewal.id, 0);
    expect(zero.probability).toBe(0);
    const hundred = await engine.updateProbability(ORG, renewal.id, 100);
    expect(hundred.probability).toBe(100);
  });

  it('get() returns null for a renewal belonging to a different organization', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    expect(await engine.get('org-2', renewal.id)).toBeNull();
  });

  it('complete() with outcome "lost" is reachable directly from pipeline without any reminder', async () => {
    const { engine } = setup();
    const renewal = await engine.createRenewal(ORG, { customerId: 'customer-1', renewalDate: '2026-06-01' });
    const lost = await engine.complete(ORG, renewal.id, 'lost');
    expect(lost.status).toBe('lost');
  });
});
