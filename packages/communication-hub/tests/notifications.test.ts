import { describe, expect, it, vi } from 'vitest';
import { createNotificationRepository } from '../src/notification/repository.impl.js';
import { canTransitionNotification, createNotificationService } from '../src/notification/service.impl.js';
import { createCommunicationEventBus } from '../src/events/communication-event-bus.js';
import { InvalidNotificationTransitionError, NotificationNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createCommunicationEventBus()) {
  const repository = createNotificationRepository();
  const service = createNotificationService(repository, eventBus);
  return { repository, service, eventBus };
}

describe('canTransitionNotification', () => {
  it('allows pending -> sent -> read', () => {
    expect(canTransitionNotification('pending', 'sent')).toBe(true);
    expect(canTransitionNotification('sent', 'read')).toBe(true);
  });

  it('allows pending -> cancelled', () => {
    expect(canTransitionNotification('pending', 'cancelled')).toBe(true);
  });

  it('forbids leaving read or cancelled', () => {
    expect(canTransitionNotification('read', 'sent')).toBe(false);
    expect(canTransitionNotification('cancelled', 'pending')).toBe(false);
  });
});

describe('createNotificationService', () => {
  it('create() starts pending', async () => {
    const { service } = setup();
    const notification = await service.create(ORG, { notificationType: 'user', title: 'New message' });
    expect(notification.status).toBe('pending');
  });

  it('supports all 5 deterministic notification types', async () => {
    const { service } = setup();
    const types = ['user', 'team', 'workflow', 'reminder', 'escalation'] as const;
    for (const notificationType of types) {
      const notification = await service.create(ORG, { notificationType, title: `A ${notificationType}` });
      expect(notification.notificationType).toBe(notificationType);
    }
  });

  it('send() stamps sentAt', async () => {
    const { service } = setup();
    const notification = await service.create(ORG, { notificationType: 'reminder', title: 'Follow up' });
    const sent = await service.send(ORG, notification.id);
    expect(sent.status).toBe('sent');
    expect(sent.sentAt).toBeDefined();
  });

  it('markRead() stamps readAt', async () => {
    const { service } = setup();
    const notification = await service.create(ORG, { notificationType: 'reminder', title: 'Follow up' });
    await service.send(ORG, notification.id);
    const read = await service.markRead(ORG, notification.id);
    expect(read.status).toBe('read');
    expect(read.readAt).toBeDefined();
  });

  it('cancel() rejects a sent notification', async () => {
    const { service } = setup();
    const notification = await service.create(ORG, { notificationType: 'reminder', title: 'Follow up' });
    await service.send(ORG, notification.id);
    await expect(service.cancel(ORG, notification.id)).rejects.toBeInstanceOf(InvalidNotificationTransitionError);
  });

  it('cancel() succeeds on a pending notification', async () => {
    const { service } = setup();
    const notification = await service.create(ORG, { notificationType: 'reminder', title: 'Follow up' });
    const cancelled = await service.cancel(ORG, notification.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('throws NotificationNotFoundError for an unknown notification', async () => {
    const { service } = setup();
    await expect(service.send(ORG, 'missing')).rejects.toBeInstanceOf(NotificationNotFoundError);
  });

  it('get() returns null for an unknown notification', async () => {
    const { service } = setup();
    expect(await service.get(ORG, 'missing')).toBeNull();
  });

  it('listByRecipient() returns every notification for a recipient', async () => {
    const { service } = setup();
    await service.create(ORG, { notificationType: 'user', title: 'A', recipientId: 'user-1' });
    await service.create(ORG, { notificationType: 'user', title: 'B', recipientId: 'user-1' });
    await service.create(ORG, { notificationType: 'user', title: 'C', recipientId: 'user-2' });

    const notifications = await service.listByRecipient(ORG, 'user-1');
    expect(notifications).toHaveLength(2);
  });

  it('publishes notification.created and notification.sent', async () => {
    const eventBus = createCommunicationEventBus();
    const created = vi.fn();
    const sent = vi.fn();
    eventBus.subscribe('notification.created', created);
    eventBus.subscribe('notification.sent', sent);

    const { service } = setup(eventBus);
    const notification = await service.create(ORG, { notificationType: 'escalation', title: 'Escalate' });
    await service.send(ORG, notification.id);
    await Promise.resolve();

    expect(created).toHaveBeenCalledTimes(1);
    expect(sent).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const notification = await service.create(ORG, { notificationType: 'user', title: 'A' });
    expect(await repository.findById('org-2', notification.id)).toBeNull();
  });
});
