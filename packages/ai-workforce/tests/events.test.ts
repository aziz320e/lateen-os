import { describe, expect, it, vi } from 'vitest';
import { createWorkforceEventBus } from '../src/events/workforce-event-bus.js';
import { WORKFORCE_EVENT_NAMES } from '../src/events/workforce-events.js';

describe('createWorkforceEventBus', () => {
  it('exposes all 10 canonical event names', () => {
    expect(Object.values(WORKFORCE_EVENT_NAMES).sort()).toEqual(
      [
        'worker.hired',
        'worker.activated',
        'worker.suspended',
        'worker.resumed',
        'worker.retired',
        'assignment.created',
        'assignment.completed',
        'assignment.failed',
        'capacity.changed',
        'performance.updated',
      ].sort(),
    );
  });

  it('delivers a published event only to subscribers of that event name', async () => {
    const bus = createWorkforceEventBus();
    const hired = vi.fn();
    const activated = vi.fn();
    bus.subscribe('worker.hired', hired);
    bus.subscribe('worker.activated', activated);

    bus.publish('worker.hired', { workerId: 'w1', organizationId: 'org-1', workforceType: 'sales_ai' });
    await Promise.resolve();

    expect(hired).toHaveBeenCalledTimes(1);
    expect(activated).not.toHaveBeenCalled();
  });

  it('subscribeAll() receives every published event', async () => {
    const bus = createWorkforceEventBus();
    const handler = vi.fn();
    bus.subscribeAll(handler);

    bus.publish('worker.hired', { workerId: 'w1', organizationId: 'org-1', workforceType: 'sales_ai' });
    bus.publish('capacity.changed', { workerId: 'w1', activeTaskCount: 1, maxConcurrentTasks: 2, state: 'available' });
    await Promise.resolve();

    expect(handler).toHaveBeenCalledTimes(2);
  });

  it('unsubscribe() stops further delivery', async () => {
    const bus = createWorkforceEventBus();
    const handler = vi.fn();
    const unsubscribe = bus.subscribe('assignment.created', handler);
    unsubscribe();

    bus.publish('assignment.created', { assignmentId: 'a1', workerId: 'w1', taskId: 't1', priority: 'high' });
    await Promise.resolve();

    expect(handler).not.toHaveBeenCalled();
  });
});
