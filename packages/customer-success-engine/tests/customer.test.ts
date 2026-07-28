import { describe, expect, it } from 'vitest';
import { createCustomerSuccessEventBus } from '../src/events/index.js';
import { canTransitionCustomerSuccess, createCustomerLifecycleEngine } from '../src/customer/engine.impl.js';
import { createCustomerSuccessRecordRepository } from '../src/customer/repository.impl.js';
import { CustomerSuccessRecordNotFoundError, DuplicateCustomerSuccessRecordError, InvalidCustomerSuccessTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const eventBus = createCustomerSuccessEventBus();
  const engine = createCustomerLifecycleEngine(createCustomerSuccessRecordRepository(), eventBus);
  return { engine, eventBus };
}

describe('canTransitionCustomerSuccess (pure)', () => {
  it('onboarding -> activation | churn', () => {
    expect(canTransitionCustomerSuccess('onboarding', 'activation')).toBe(true);
    expect(canTransitionCustomerSuccess('onboarding', 'churn')).toBe(true);
    expect(canTransitionCustomerSuccess('onboarding', 'adoption')).toBe(false);
  });

  it('activation -> adoption | churn', () => {
    expect(canTransitionCustomerSuccess('activation', 'adoption')).toBe(true);
    expect(canTransitionCustomerSuccess('activation', 'churn')).toBe(true);
  });

  it('adoption -> expansion | renewal | churn', () => {
    expect(canTransitionCustomerSuccess('adoption', 'expansion')).toBe(true);
    expect(canTransitionCustomerSuccess('adoption', 'renewal')).toBe(true);
    expect(canTransitionCustomerSuccess('adoption', 'churn')).toBe(true);
  });

  it('expansion -> renewal | churn', () => {
    expect(canTransitionCustomerSuccess('expansion', 'renewal')).toBe(true);
    expect(canTransitionCustomerSuccess('expansion', 'churn')).toBe(true);
    expect(canTransitionCustomerSuccess('expansion', 'adoption')).toBe(false);
  });

  it('renewal -> adoption | expansion | churn', () => {
    expect(canTransitionCustomerSuccess('renewal', 'adoption')).toBe(true);
    expect(canTransitionCustomerSuccess('renewal', 'expansion')).toBe(true);
    expect(canTransitionCustomerSuccess('renewal', 'churn')).toBe(true);
  });

  it('churn -> reactivation only', () => {
    expect(canTransitionCustomerSuccess('churn', 'reactivation')).toBe(true);
    expect(canTransitionCustomerSuccess('churn', 'onboarding')).toBe(false);
  });

  it('reactivation -> onboarding | activation', () => {
    expect(canTransitionCustomerSuccess('reactivation', 'onboarding')).toBe(true);
    expect(canTransitionCustomerSuccess('reactivation', 'activation')).toBe(true);
    expect(canTransitionCustomerSuccess('reactivation', 'churn')).toBe(false);
  });
});

describe('CustomerLifecycleEngine', () => {
  it('onboard() starts a record at onboarding status', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    expect(record.status).toBe('onboarding');
    expect(record.currentVersion).toBe(1);
  });

  it('publishes customer.onboarded on onboard()', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('customer.onboarded', (payload) => (seen = payload));
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    expect(seen).toEqual({ organizationId: ORG, customerSuccessRecordId: record.id, customerId: 'customer-1' });
  });

  it('rejects a duplicate customer success record for the same customer', async () => {
    const { engine } = setup();
    await engine.onboard(ORG, { customerId: 'customer-1' });
    await expect(engine.onboard(ORG, { customerId: 'customer-1' })).rejects.toBeInstanceOf(DuplicateCustomerSuccessRecordError);
  });

  it('allows the same customerId across different organizations', async () => {
    const { engine } = setup();
    await engine.onboard(ORG, { customerId: 'customer-1' });
    await expect(engine.onboard('org-2', { customerId: 'customer-1' })).resolves.toBeTruthy();
  });

  it('activate() moves onboarding -> activation and publishes customer.activated', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('customer.activated', (payload) => (seen = payload));
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    const activated = await engine.activate(ORG, record.id);
    expect(activated.status).toBe('activation');
    expect(seen).toEqual({ organizationId: ORG, customerSuccessRecordId: record.id, customerId: 'customer-1' });
  });

  it('progressToAdoption() moves activation -> adoption', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.activate(ORG, record.id);
    const adopted = await engine.progressToAdoption(ORG, record.id);
    expect(adopted.status).toBe('adoption');
  });

  it('expand() and renew() are reachable from adoption', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.activate(ORG, record.id);
    await engine.progressToAdoption(ORG, record.id);
    const expanded = await engine.expand(ORG, record.id);
    expect(expanded.status).toBe('expansion');
  });

  it('renew() moves adoption -> renewal, and adoption is reachable again from renewal', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.activate(ORG, record.id);
    await engine.progressToAdoption(ORG, record.id);
    const renewed = await engine.renew(ORG, record.id);
    expect(renewed.status).toBe('renewal');
    const backToAdoption = await engine.progressToAdoption(ORG, record.id);
    expect(backToAdoption.status).toBe('adoption');
  });

  it('churn() is reachable from any non-terminal status and publishes customer.churned', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('customer.churned', (payload) => (seen = payload));
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    const churned = await engine.churn(ORG, record.id);
    expect(churned.status).toBe('churn');
    expect(seen).toEqual({ organizationId: ORG, customerSuccessRecordId: record.id, customerId: 'customer-1' });
  });

  it('reactivate() moves churn -> reactivation and publishes customer.reactivated', async () => {
    const { engine, eventBus } = setup();
    let seen: unknown;
    eventBus.subscribe('customer.reactivated', (payload) => (seen = payload));
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.churn(ORG, record.id);
    const reactivated = await engine.reactivate(ORG, record.id);
    expect(reactivated.status).toBe('reactivation');
    expect(seen).toEqual({ organizationId: ORG, customerSuccessRecordId: record.id, customerId: 'customer-1' });
  });

  it('rejects an invalid transition (churn -> onboarding directly)', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.churn(ORG, record.id);
    await expect(engine.progressToAdoption(ORG, record.id)).rejects.toBeInstanceOf(InvalidCustomerSuccessTransitionError);
  });

  it('activate()/churn()/reactivate() throw CustomerSuccessRecordNotFoundError for an unknown record', async () => {
    const { engine } = setup();
    await expect(engine.activate(ORG, 'missing')).rejects.toBeInstanceOf(CustomerSuccessRecordNotFoundError);
    await expect(engine.churn(ORG, 'missing')).rejects.toBeInstanceOf(CustomerSuccessRecordNotFoundError);
    await expect(engine.reactivate(ORG, 'missing')).rejects.toBeInstanceOf(CustomerSuccessRecordNotFoundError);
  });

  it('onboard() accepts an optional ownerId', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1', ownerId: 'employee-1' });
    expect(record.ownerId).toBe('employee-1');
  });

  it('findByCustomer() returns null for an unknown customer', async () => {
    const { engine } = setup();
    expect(await engine.findByCustomer(ORG, 'missing')).toBeNull();
  });

  it('findByStatus() filters correctly', async () => {
    const { engine } = setup();
    await engine.onboard(ORG, { customerId: 'customer-1' });
    const record2 = await engine.onboard(ORG, { customerId: 'customer-2' });
    await engine.activate(ORG, record2.id);
    expect(await engine.findByStatus(ORG, 'onboarding')).toHaveLength(1);
    expect(await engine.findByStatus(ORG, 'activation')).toHaveLength(1);
  });

  it('get()/list() work as expected', async () => {
    const { engine } = setup();
    expect(await engine.get(ORG, 'missing')).toBeNull();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    expect(await engine.get(ORG, record.id)).toEqual(record);
    expect(await engine.list(ORG)).toHaveLength(1);
  });

  it('records are isolated per organization', async () => {
    const { engine } = setup();
    await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.onboard('org-2', { customerId: 'customer-1' });
    expect(await engine.list(ORG)).toHaveLength(1);
    expect(await engine.list('org-2')).toHaveLength(1);
  });

  it('a full onboarding -> activation -> adoption -> expansion -> renewal -> adoption cycle is reachable', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.activate(ORG, record.id);
    await engine.progressToAdoption(ORG, record.id);
    await engine.expand(ORG, record.id);
    const renewed = await engine.renew(ORG, record.id);
    expect(renewed.status).toBe('renewal');
    const backToAdoption = await engine.progressToAdoption(ORG, record.id);
    expect(backToAdoption.status).toBe('adoption');
  });

  it('renew() is reachable directly from expansion', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.activate(ORG, record.id);
    await engine.progressToAdoption(ORG, record.id);
    await engine.expand(ORG, record.id);
    const renewed = await engine.renew(ORG, record.id);
    expect(renewed.status).toBe('renewal');
  });

  it('expansion is reachable again from renewal', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.activate(ORG, record.id);
    await engine.progressToAdoption(ORG, record.id);
    await engine.renew(ORG, record.id);
    const expanded = await engine.expand(ORG, record.id);
    expect(expanded.status).toBe('expansion');
  });

  it('a reactivated customer can re-enter onboarding via restartOnboarding()', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.churn(ORG, record.id);
    await engine.reactivate(ORG, record.id);
    const restarted = await engine.restartOnboarding(ORG, record.id);
    expect(restarted.status).toBe('onboarding');
  });

  it('restartOnboarding() rejects a record that is not in reactivation', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await expect(engine.restartOnboarding(ORG, record.id)).rejects.toBeInstanceOf(InvalidCustomerSuccessTransitionError);
  });

  it('a reactivated customer can move directly to activation', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.churn(ORG, record.id);
    await engine.reactivate(ORG, record.id);
    const activated = await engine.activate(ORG, record.id);
    expect(activated.status).toBe('activation');
  });

  it('rejects churn() called on an already-churned record with no path except reactivation', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.churn(ORG, record.id);
    await expect(engine.churn(ORG, record.id)).rejects.toBeInstanceOf(InvalidCustomerSuccessTransitionError);
  });

  it('rejects expand() called directly from onboarding', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await expect(engine.expand(ORG, record.id)).rejects.toBeInstanceOf(InvalidCustomerSuccessTransitionError);
  });

  it('rejects renew() called directly from activation', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.activate(ORG, record.id);
    await expect(engine.renew(ORG, record.id)).rejects.toBeInstanceOf(InvalidCustomerSuccessTransitionError);
  });

  it('every onboarded record starts with currentVersion 1 and increments on every transition', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    const activated = await engine.activate(ORG, record.id);
    expect(activated.currentVersion).toBe(2);
    const adopted = await engine.progressToAdoption(ORG, record.id);
    expect(adopted.currentVersion).toBe(3);
  });

  it('list() returns an empty array for an organization with no records', async () => {
    const { engine } = setup();
    expect(await engine.list(ORG)).toEqual([]);
  });

  it('findByStatus() returns an empty array when no record matches', async () => {
    const { engine } = setup();
    await engine.onboard(ORG, { customerId: 'customer-1' });
    expect(await engine.findByStatus(ORG, 'churn')).toEqual([]);
  });

  it('onboard() without an ownerId leaves it undefined', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    expect(record.ownerId).toBeUndefined();
  });

  it('progressToAdoption()/expand()/renew() throw CustomerSuccessRecordNotFoundError for an unknown record', async () => {
    const { engine } = setup();
    await expect(engine.progressToAdoption(ORG, 'missing')).rejects.toBeInstanceOf(CustomerSuccessRecordNotFoundError);
    await expect(engine.expand(ORG, 'missing')).rejects.toBeInstanceOf(CustomerSuccessRecordNotFoundError);
    await expect(engine.renew(ORG, 'missing')).rejects.toBeInstanceOf(CustomerSuccessRecordNotFoundError);
  });

  it('rejects reactivate() called on a record that has not churned', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await expect(engine.reactivate(ORG, record.id)).rejects.toBeInstanceOf(InvalidCustomerSuccessTransitionError);
  });

  it('rejects progressToAdoption() called directly from onboarding', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await expect(engine.progressToAdoption(ORG, record.id)).rejects.toBeInstanceOf(InvalidCustomerSuccessTransitionError);
  });

  it('churn() from expansion is a valid path', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.activate(ORG, record.id);
    await engine.progressToAdoption(ORG, record.id);
    await engine.expand(ORG, record.id);
    const churned = await engine.churn(ORG, record.id);
    expect(churned.status).toBe('churn');
  });

  it('churn() from renewal is a valid path', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.activate(ORG, record.id);
    await engine.progressToAdoption(ORG, record.id);
    await engine.renew(ORG, record.id);
    const churned = await engine.churn(ORG, record.id);
    expect(churned.status).toBe('churn');
  });

  it('get() returns null for a record belonging to a different organization', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    expect(await engine.get('org-2', record.id)).toBeNull();
  });

  it('multiple reactivation cycles are possible for the same customer', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    await engine.churn(ORG, record.id);
    await engine.reactivate(ORG, record.id);
    await engine.activate(ORG, record.id);
    const churnedAgain = await engine.churn(ORG, record.id);
    expect(churnedAgain.status).toBe('churn');
    const reactivatedAgain = await engine.reactivate(ORG, record.id);
    expect(reactivatedAgain.status).toBe('reactivation');
  });

  it('findByCustomer() only ever returns one record per customer per organization', async () => {
    const { engine } = setup();
    const record = await engine.onboard(ORG, { customerId: 'customer-1' });
    const found = await engine.findByCustomer(ORG, 'customer-1');
    expect(found?.id).toBe(record.id);
  });
});
