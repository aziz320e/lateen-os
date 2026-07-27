import { describe, expect, it, vi } from 'vitest';
import { createInstitutionalMemoryEventBus } from '../src/events/institutional-memory-event-bus.js';
import { INSTITUTIONAL_MEMORY_EVENT_NAMES } from '../src/events/institutional-memory-events.js';

describe('createInstitutionalMemoryEventBus', () => {
  it('exposes all 8 required knowledge.* events', () => {
    expect(Object.values(INSTITUTIONAL_MEMORY_EVENT_NAMES).sort()).toEqual(
      [
        'knowledge.created',
        'knowledge.updated',
        'knowledge.archived',
        'knowledge.restored',
        'knowledge.version.created',
        'knowledge.review.required',
        'knowledge.expired',
        'knowledge.relationship.created',
      ].sort(),
    );
  });

  it('delivers a published event only to subscribers of that event name', async () => {
    const bus = createInstitutionalMemoryEventBus();
    const created = vi.fn();
    const archived = vi.fn();
    bus.subscribe('knowledge.created', created);
    bus.subscribe('knowledge.archived', archived);

    bus.publish('knowledge.created', { knowledgeEntryId: 'k1', organizationId: 'org-1', title: 'A', knowledgeType: 'faq' });
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(archived).not.toHaveBeenCalled();
  });

  it('subscribeAll() receives every published event', async () => {
    const bus = createInstitutionalMemoryEventBus();
    const handler = vi.fn();
    bus.subscribeAll(handler);

    bus.publish('knowledge.created', { knowledgeEntryId: 'k1', organizationId: 'org-1', title: 'A', knowledgeType: 'faq' });
    bus.publish('knowledge.expired', { knowledgeEntryId: 'k1', organizationId: 'org-1' });
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe() stops further delivery', async () => {
    const bus = createInstitutionalMemoryEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('knowledge.version.created', handler);
    unsubscribe();

    bus.publish('knowledge.version.created', { knowledgeEntryId: 'k1', organizationId: 'org-1', revisionNumber: 1 });
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });
});
