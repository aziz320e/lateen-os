/**
 * Real Notifications service — user, team, workflow, reminder, and
 * escalation notifications, moving through a guarded lifecycle.
 *
 * @module notification/service.impl
 */
import type { CommunicationEventBus } from '../events/communication-event-bus.js';
import { InvalidNotificationTransitionError, NotificationNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ConversationId, NotificationId, OrganizationId } from '../shared/identifiers.js';
import type { NotificationRepository } from './repository.js';
import type { Notification, NotificationStatus, NotificationType } from './types.js';

const NOTIFICATION_TRANSITIONS: Readonly<Record<NotificationStatus, readonly NotificationStatus[]>> = {
  pending: ['sent', 'cancelled'],
  sent: ['read'],
  read: [],
  cancelled: [],
};

export function canTransitionNotification(from: NotificationStatus, to: NotificationStatus): boolean {
  return NOTIFICATION_TRANSITIONS[from].includes(to);
}

export interface CreateNotificationInput {
  readonly notificationType: NotificationType;
  readonly title: string;
  readonly body?: string;
  readonly recipientId?: string;
  readonly relatedConversationId?: ConversationId;
}

export interface NotificationService {
  create(organizationId: OrganizationId, input: CreateNotificationInput): Promise<Notification>;
  send(organizationId: OrganizationId, notificationId: NotificationId): Promise<Notification>;
  markRead(organizationId: OrganizationId, notificationId: NotificationId): Promise<Notification>;
  cancel(organizationId: OrganizationId, notificationId: NotificationId): Promise<Notification>;
  get(organizationId: OrganizationId, notificationId: NotificationId): Promise<Notification | null>;
  listByRecipient(organizationId: OrganizationId, recipientId: string): Promise<readonly Notification[]>;
}

/** Creates a real {@link NotificationService} backed by a {@link NotificationRepository}. */
export function createNotificationService(
  repository: NotificationRepository,
  eventBus?: CommunicationEventBus,
  now: () => string = nowIso,
): NotificationService {
  async function requireNotification(organizationId: OrganizationId, notificationId: NotificationId): Promise<Notification> {
    const notification = await repository.findById(organizationId, notificationId);
    if (!notification) throw new NotificationNotFoundError(notificationId);
    return notification;
  }

  async function transition(organizationId: OrganizationId, notificationId: NotificationId, to: NotificationStatus): Promise<Notification> {
    const notification = await requireNotification(organizationId, notificationId);
    if (!canTransitionNotification(notification.status, to)) {
      throw new InvalidNotificationTransitionError(notificationId, notification.status, to);
    }
    const updated: Notification = { ...notification, status: to, updatedAt: now() };
    await repository.save(updated);
    return updated;
  }

  return {
    async create(organizationId, input) {
      const timestamp = now();
      const notification: Notification = {
        id: generateId('notification'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        notificationType: input.notificationType,
        status: 'pending',
        recipientId: input.recipientId,
        title: input.title,
        body: input.body,
        relatedConversationId: input.relatedConversationId,
      };
      await repository.save(notification);
      eventBus?.publish('notification.created', { notificationId: notification.id, organizationId, notificationType: notification.notificationType });
      return notification;
    },

    async send(organizationId, notificationId) {
      const sent = await transition(organizationId, notificationId, 'sent');
      const updated: Notification = { ...sent, sentAt: now() };
      await repository.save(updated);
      eventBus?.publish('notification.sent', { notificationId, organizationId });
      return updated;
    },

    async markRead(organizationId, notificationId) {
      const read = await transition(organizationId, notificationId, 'read');
      const updated: Notification = { ...read, readAt: now() };
      await repository.save(updated);
      return updated;
    },

    async cancel(organizationId, notificationId) {
      return transition(organizationId, notificationId, 'cancelled');
    },

    async get(organizationId, notificationId) {
      return repository.findById(organizationId, notificationId);
    },

    async listByRecipient(organizationId, recipientId) {
      return repository.findByRecipient(organizationId, recipientId);
    },
  };
}
