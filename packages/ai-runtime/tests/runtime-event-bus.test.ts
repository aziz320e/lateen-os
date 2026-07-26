import { describe, expect, it, vi } from 'vitest';
import { createRuntimeEventBus } from '../src/events/runtime-event-bus.js';

describe('createRuntimeEventBus', () => {
  it('delivers a typed event to a subscriber of that event name', async () => {
    const bus = createRuntimeEventBus();
    const handler = vi.fn();
    bus.subscribe('task.completed', handler);

    bus.publish('task.completed', { taskId: 't1' });
    await Promise.resolve();

    expect(handler).toHaveBeenCalledWith({ taskId: 't1' }, expect.objectContaining({ name: 'task.completed' }));
  });
});
