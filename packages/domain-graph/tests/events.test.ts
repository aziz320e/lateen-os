import { describe, expect, it, vi } from 'vitest';
import { createDomainGraphEventBus } from '../src/events/domain-graph-event-bus.js';
import { DOMAIN_GRAPH_EVENT_NAMES } from '../src/events/domain-graph-events.js';

describe('createDomainGraphEventBus', () => {
  it('exposes all 8 required events', () => {
    expect(Object.values(DOMAIN_GRAPH_EVENT_NAMES).sort()).toEqual(
      [
        'entity.created',
        'entity.updated',
        'entity.archived',
        'relationship.created',
        'relationship.updated',
        'relationship.deleted',
        'graph.validated',
        'graph.rebuilt',
      ].sort(),
    );
  });

  it('delivers a published event only to subscribers of that event name', async () => {
    const bus = createDomainGraphEventBus();
    const created = vi.fn();
    const archived = vi.fn();
    bus.subscribe('entity.created', created);
    bus.subscribe('entity.archived', archived);

    bus.publish('entity.created', { nodeId: 'n1', organizationId: 'org-1', graphId: 'graph-1', nodeType: 'organization' });
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(archived).not.toHaveBeenCalled();
  });

  it('subscribeAll() receives every published event', async () => {
    const bus = createDomainGraphEventBus();
    const handler = vi.fn();
    bus.subscribeAll(handler);

    bus.publish('entity.created', { nodeId: 'n1', organizationId: 'org-1', graphId: 'graph-1', nodeType: 'organization' });
    bus.publish('graph.rebuilt', { graphId: 'graph-1', organizationId: 'org-1', entityCount: 1, relationshipCount: 0 });
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe() stops further delivery', async () => {
    const bus = createDomainGraphEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('relationship.created', handler);
    unsubscribe();

    bus.publish('relationship.created', {
      relationshipId: 'r1',
      organizationId: 'org-1',
      graphId: 'graph-1',
      relationshipType: 'owns',
      sourceNodeId: 'n1',
      targetNodeId: 'n2',
    });
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });
});
