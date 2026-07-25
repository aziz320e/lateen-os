import { describe, expect, it, vi } from 'vitest';
import { createEventBus } from '../src/events/event-bus.js';

interface TestEventMap {
  readonly 'item.created': { readonly id: string };
  readonly 'item.deleted': { readonly id: string };
}

describe('createEventBus', () => {
  it('delivers published events to subscribers of that event name', async () => {
    const bus = createEventBus<TestEventMap>();
    const handler = vi.fn();
    bus.subscribe('item.created', handler);

    bus.publish('item.created', { id: '1' }, 'test-source');
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(
      { id: '1' },
      expect.objectContaining({ name: 'item.created', source: 'test-source' }),
    );
  });

  it('does not deliver events to subscribers of a different name', async () => {
    const bus = createEventBus<TestEventMap>();
    const handler = vi.fn();
    bus.subscribe('item.deleted', handler);

    bus.publish('item.created', { id: '1' });
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });

  it('unsubscribes via the returned function', async () => {
    const bus = createEventBus<TestEventMap>();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('item.created', handler);
    unsubscribe();

    bus.publish('item.created', { id: '1' });
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });

  it('delivers every event to wildcard subscribers', async () => {
    const bus = createEventBus<TestEventMap>();
    const handler = vi.fn();
    bus.subscribeAll(handler);

    bus.publish('item.created', { id: '1' });
    bus.publish('item.deleted', { id: '2' });
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(2);
    expect(handler).toHaveBeenNthCalledWith(1, 'item.created', { id: '1' }, expect.any(Object));
    expect(handler).toHaveBeenNthCalledWith(2, 'item.deleted', { id: '2' }, expect.any(Object));
  });

  it('supports multiple independent subscribers on the same event', async () => {
    const bus = createEventBus<TestEventMap>();
    const handlerA = vi.fn();
    const handlerB = vi.fn();
    bus.subscribe('item.created', handlerA);
    bus.subscribe('item.created', handlerB);

    bus.publish('item.created', { id: '1' });
    await Promise.resolve();

    expect(handlerA).toHaveBeenCalledTimes(1);
    expect(handlerB).toHaveBeenCalledTimes(1);
  });
});
