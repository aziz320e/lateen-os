import { describe, expect, it, vi } from 'vitest';
import { createBusinessDnaEventBus } from '../src/events/business-dna-event-bus.js';
import { BUSINESS_DNA_EVENT_NAMES } from '../src/events/business-dna-events.js';

describe('createBusinessDnaEventBus', () => {
  it('exposes the 8 required events plus organization lifecycle extensions', () => {
    const names = Object.values(BUSINESS_DNA_EVENT_NAMES);
    for (const required of [
      'organization.created',
      'organization.updated',
      'organization.archived',
      'business-profile.updated',
      'product.created',
      'product.updated',
      'competitor.registered',
      'policy.updated',
    ]) {
      expect(names).toContain(required);
    }
    expect(names).toContain('organization.activated');
    expect(names).toContain('organization.suspended');
    expect(names).toContain('organization.restored');
  });

  it('delivers a published event only to subscribers of that event name', async () => {
    const bus = createBusinessDnaEventBus();
    const created = vi.fn();
    const archived = vi.fn();
    bus.subscribe('organization.created', created);
    bus.subscribe('organization.archived', archived);

    bus.publish('organization.created', { code: 'acme', name: 'Acme' });
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(archived).not.toHaveBeenCalled();
  });

  it('subscribeAll() receives every published event', async () => {
    const bus = createBusinessDnaEventBus();
    const handler = vi.fn();
    bus.subscribeAll(handler);

    bus.publish('organization.created', { code: 'acme', name: 'Acme' });
    bus.publish('policy.updated', { policyId: 'p1', organizationId: 'org-1' });
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe() stops further delivery', async () => {
    const bus = createBusinessDnaEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('product.created', handler);
    unsubscribe();

    bus.publish('product.created', { productId: 'p1', organizationId: 'org-1', code: 'SIGN-001' });
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });
});
