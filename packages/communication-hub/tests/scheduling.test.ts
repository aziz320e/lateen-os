import { describe, expect, it } from 'vitest';
import { createMessageRepository } from '../src/message/repository.impl.js';
import { createMessageLifecycle } from '../src/message/lifecycle.impl.js';
import { createChannelRegistry } from '../src/channel/index.js';
import { createNotificationRepository } from '../src/notification/repository.impl.js';
import { createNotificationService } from '../src/notification/service.impl.js';
import { createScheduledItemRepository } from '../src/scheduling/repository.impl.js';
import { computeNextOccurrence, createSchedulingService } from '../src/scheduling/service.impl.js';
import { ScheduledItemNotFoundError, InvalidScheduledItemTransitionError } from '../src/shared/errors.js';

const ORG = 'org-1';
const CONVERSATION = 'conversation-1';

describe('computeNextOccurrence (pure)', () => {
  it('advances daily', () => {
    expect(computeNextOccurrence('2026-03-01T00:00:00.000Z', { frequency: 'daily', interval: 1 })).toBe('2026-03-02T00:00:00.000Z');
  });

  it('advances weekly with an interval', () => {
    expect(computeNextOccurrence('2026-03-01T00:00:00.000Z', { frequency: 'weekly', interval: 2 })).toBe('2026-03-15T00:00:00.000Z');
  });

  it('advances monthly', () => {
    expect(computeNextOccurrence('2026-01-01T00:00:00.000Z', { frequency: 'monthly', interval: 1 })).toBe('2026-02-01T00:00:00.000Z');
  });
});

function setup() {
  const messageRepository = createMessageRepository();
  const messages = createMessageLifecycle(messageRepository, createChannelRegistry());
  const notificationRepository = createNotificationRepository();
  const notifications = createNotificationService(notificationRepository);
  const repository = createScheduledItemRepository();
  const scheduling = createSchedulingService(repository, messages, notifications);
  return { messageRepository, messages, notificationRepository, notifications, repository, scheduling };
}

describe('createSchedulingService', () => {
  it('scheduleMessage() creates a draft message and a scheduled item referencing it', async () => {
    const { scheduling, messages } = setup();
    const item = await scheduling.scheduleMessage(ORG, {
      message: { conversationId: CONVERSATION, messageType: 'email', body: 'Reminder' },
      scheduledFor: '2026-03-01T00:00:00.000Z',
    });
    expect(item.status).toBe('scheduled');
    expect(item.itemType).toBe('message');
    const message = await messages.get(ORG, item.referenceId);
    expect(message?.status).toBe('draft');
  });

  it('scheduleNotification() creates a pending notification and a scheduled item referencing it', async () => {
    const { scheduling, notifications } = setup();
    const item = await scheduling.scheduleNotification(ORG, {
      notification: { notificationType: 'reminder', title: 'Follow up' },
      scheduledFor: '2026-03-01T00:00:00.000Z',
    });
    expect(item.itemType).toBe('notification');
    const notification = await notifications.get(ORG, item.referenceId);
    expect(notification?.status).toBe('pending');
  });

  it('dispatchDue() dispatches a due delayed message, transitioning it to sent', async () => {
    const { scheduling, messages } = setup();
    const item = await scheduling.scheduleMessage(ORG, {
      message: { conversationId: CONVERSATION, messageType: 'email' },
      scheduledFor: '2026-01-01T00:00:00.000Z',
    });
    const dispatched = await scheduling.dispatchDue(ORG, '2026-01-02T00:00:00.000Z');
    expect(dispatched.map((i) => i.id)).toEqual([item.id]);
    expect(dispatched[0]?.status).toBe('dispatched');
    const message = await messages.get(ORG, item.referenceId);
    expect(message?.status).toBe('sent');
  });

  it('dispatchDue() does not dispatch items not yet due', async () => {
    const { scheduling } = setup();
    await scheduling.scheduleMessage(ORG, {
      message: { conversationId: CONVERSATION, messageType: 'email' },
      scheduledFor: '2099-01-01T00:00:00.000Z',
    });
    const dispatched = await scheduling.dispatchDue(ORG, '2026-01-01T00:00:00.000Z');
    expect(dispatched).toHaveLength(0);
  });

  it('dispatchDue() reschedules a recurring notification for its next occurrence', async () => {
    const { scheduling } = setup();
    await scheduling.scheduleNotification(ORG, {
      notification: { notificationType: 'reminder', title: 'Daily check-in' },
      scheduledFor: '2026-01-01T00:00:00.000Z',
      recurrence: { frequency: 'daily', interval: 1 },
    });

    const dispatched = await scheduling.dispatchDue(ORG, '2026-01-01T12:00:00.000Z');
    expect(dispatched).toHaveLength(1);

    const scheduled = await scheduling.listByStatus(ORG, 'scheduled');
    expect(scheduled).toHaveLength(1);
    expect(scheduled[0]?.scheduledFor).toBe('2026-01-02T00:00:00.000Z');
    expect(scheduled[0]?.occurrenceNumber).toBe(2);
  });

  it('dispatchDue() stops rescheduling once the recurrence count is reached', async () => {
    const { scheduling } = setup();
    await scheduling.scheduleNotification(ORG, {
      notification: { notificationType: 'reminder', title: 'Twice only' },
      scheduledFor: '2026-01-01T00:00:00.000Z',
      recurrence: { frequency: 'daily', interval: 1, count: 2 },
    });

    await scheduling.dispatchDue(ORG, '2026-01-01T12:00:00.000Z');
    await scheduling.dispatchDue(ORG, '2026-01-02T12:00:00.000Z');
    const scheduled = await scheduling.listByStatus(ORG, 'scheduled');
    expect(scheduled).toHaveLength(0);

    const dispatched = await scheduling.listByStatus(ORG, 'dispatched');
    expect(dispatched).toHaveLength(2);
  });

  it('cancel() cancels a scheduled item', async () => {
    const { scheduling } = setup();
    const item = await scheduling.scheduleMessage(ORG, {
      message: { conversationId: CONVERSATION, messageType: 'email' },
      scheduledFor: '2026-01-01T00:00:00.000Z',
    });
    const cancelled = await scheduling.cancel(ORG, item.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('cancel() rejects an already-dispatched item', async () => {
    const { scheduling } = setup();
    const item = await scheduling.scheduleMessage(ORG, {
      message: { conversationId: CONVERSATION, messageType: 'email' },
      scheduledFor: '2026-01-01T00:00:00.000Z',
    });
    await scheduling.dispatchDue(ORG, '2026-01-02T00:00:00.000Z');
    await expect(scheduling.cancel(ORG, item.id)).rejects.toBeInstanceOf(InvalidScheduledItemTransitionError);
  });

  it('throws ScheduledItemNotFoundError for an unknown item', async () => {
    const { scheduling } = setup();
    await expect(scheduling.cancel(ORG, 'missing')).rejects.toBeInstanceOf(ScheduledItemNotFoundError);
  });

  it('get() returns null for an unknown item', async () => {
    const { scheduling } = setup();
    expect(await scheduling.get(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { scheduling } = setup();
    const item = await scheduling.scheduleMessage(ORG, {
      message: { conversationId: CONVERSATION, messageType: 'email' },
      scheduledFor: '2026-01-01T00:00:00.000Z',
    });
    expect(await scheduling.get('org-2', item.id)).toBeNull();
  });
});
