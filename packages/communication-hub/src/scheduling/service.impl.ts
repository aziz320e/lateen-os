/**
 * Real Scheduling service — delayed messages, recurring notifications,
 * and reminders, dispatched deterministically as of a given instant.
 *
 * @module scheduling/service.impl
 */
import type { CreateMessageInput, MessageLifecycle } from '../message/index.js';
import type { CreateNotificationInput, NotificationService } from '../notification/index.js';
import { InvalidScheduledItemTransitionError, ScheduledItemNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId, ScheduledItemId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { ScheduledItemRepository } from './repository.js';
import type { RecurrenceRule, ScheduledItem } from './types.js';

function addInterval(date: Date, frequency: RecurrenceRule['frequency'], interval: number): Date {
  const next = new Date(date.getTime());
  if (frequency === 'daily') next.setUTCDate(next.getUTCDate() + interval);
  else if (frequency === 'weekly') next.setUTCDate(next.getUTCDate() + interval * 7);
  else next.setUTCMonth(next.getUTCMonth() + interval);
  return next;
}

/** Pure: the next occurrence's timestamp for a recurrence rule, advancing from the current occurrence. */
export function computeNextOccurrence(current: ISODateTime, recurrence: RecurrenceRule): ISODateTime {
  return addInterval(new Date(current), recurrence.frequency, recurrence.interval).toISOString();
}

export interface ScheduleMessageInput {
  readonly message: CreateMessageInput;
  readonly scheduledFor: ISODateTime;
  readonly recurrence?: RecurrenceRule;
}

export interface ScheduleNotificationInput {
  readonly notification: CreateNotificationInput;
  readonly scheduledFor: ISODateTime;
  readonly recurrence?: RecurrenceRule;
}

export interface SchedulingService {
  scheduleMessage(organizationId: OrganizationId, input: ScheduleMessageInput): Promise<ScheduledItem>;
  scheduleNotification(organizationId: OrganizationId, input: ScheduleNotificationInput): Promise<ScheduledItem>;
  /** Dispatches every `'scheduled'` item due at or before `asOf`, rescheduling recurring items deterministically. */
  dispatchDue(organizationId: OrganizationId, asOf?: ISODateTime): Promise<readonly ScheduledItem[]>;
  cancel(organizationId: OrganizationId, itemId: ScheduledItemId): Promise<ScheduledItem>;
  get(organizationId: OrganizationId, itemId: ScheduledItemId): Promise<ScheduledItem | null>;
  listByStatus(organizationId: OrganizationId, status: ScheduledItem['status']): Promise<readonly ScheduledItem[]>;
}

function newScheduledItem(
  organizationId: OrganizationId,
  itemType: ScheduledItem['itemType'],
  referenceId: string,
  scheduledFor: ISODateTime,
  recurrence: RecurrenceRule | undefined,
  occurrenceNumber: number,
  timestamp: ISODateTime,
): ScheduledItem {
  return {
    id: generateId('scheduled-item'),
    organizationId,
    createdAt: timestamp,
    updatedAt: timestamp,
    itemType,
    referenceId,
    status: 'scheduled',
    scheduledFor,
    recurrence,
    occurrenceNumber,
  };
}

/** Creates a real {@link SchedulingService} composing the Messaging and Notifications services with its own repository. */
export function createSchedulingService(
  repository: ScheduledItemRepository,
  messages: MessageLifecycle,
  notifications: NotificationService,
  now: () => string = nowIso,
): SchedulingService {
  async function requireItem(organizationId: OrganizationId, itemId: ScheduledItemId): Promise<ScheduledItem> {
    const item = await repository.findById(organizationId, itemId);
    if (!item) throw new ScheduledItemNotFoundError(itemId);
    return item;
  }

  /** Reschedules a dispatched recurring item by re-creating the underlying message/notification for the next occurrence. */
  async function rescheduleNextOccurrence(organizationId: OrganizationId, item: ScheduledItem): Promise<void> {
    if (!item.recurrence) return;
    if (item.recurrence.count !== undefined && item.occurrenceNumber >= item.recurrence.count) return;

    const nextScheduledFor = computeNextOccurrence(item.scheduledFor, item.recurrence);

    let nextReferenceId: string;
    if (item.itemType === 'message') {
      const original = await messages.get(organizationId, item.referenceId);
      const nextMessage = await messages.create(organizationId, {
        conversationId: original!.conversationId,
        messageType: original!.messageType,
        senderParticipantId: original!.senderParticipantId,
        recipient: original!.recipient,
        body: original!.body,
        attachmentIds: original!.attachmentIds,
      });
      nextReferenceId = nextMessage.id;
    } else {
      const original = await notifications.get(organizationId, item.referenceId);
      const nextNotification = await notifications.create(organizationId, {
        notificationType: original!.notificationType,
        title: original!.title,
        body: original!.body,
        recipientId: original!.recipientId,
        relatedConversationId: original!.relatedConversationId,
      });
      nextReferenceId = nextNotification.id;
    }

    const nextItem = newScheduledItem(
      organizationId,
      item.itemType,
      nextReferenceId,
      nextScheduledFor,
      item.recurrence,
      item.occurrenceNumber + 1,
      now(),
    );
    await repository.save(nextItem);
  }

  return {
    async scheduleMessage(organizationId, input) {
      const message = await messages.create(organizationId, input.message);
      const item = newScheduledItem(organizationId, 'message', message.id, input.scheduledFor, input.recurrence, 1, now());
      await repository.save(item);
      return item;
    },

    async scheduleNotification(organizationId, input) {
      const notification = await notifications.create(organizationId, input.notification);
      const item = newScheduledItem(organizationId, 'notification', notification.id, input.scheduledFor, input.recurrence, 1, now());
      await repository.save(item);
      return item;
    },

    async dispatchDue(organizationId, asOf) {
      const cutoff = asOf ?? now();
      const due = (await repository.findByStatus(organizationId, 'scheduled')).filter((item) => item.scheduledFor <= cutoff);

      const dispatched: ScheduledItem[] = [];
      for (const item of due) {
        if (item.itemType === 'message') {
          await messages.send(organizationId, item.referenceId);
        } else {
          await notifications.send(organizationId, item.referenceId);
        }

        const updated: ScheduledItem = { ...item, status: 'dispatched', dispatchedAt: now(), updatedAt: now() };
        await repository.save(updated);
        dispatched.push(updated);

        await rescheduleNextOccurrence(organizationId, item);
      }
      return dispatched;
    },

    async cancel(organizationId, itemId) {
      const item = await requireItem(organizationId, itemId);
      if (item.status !== 'scheduled') {
        throw new InvalidScheduledItemTransitionError(itemId, item.status, 'cancelled');
      }
      const updated: ScheduledItem = { ...item, status: 'cancelled', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async get(organizationId, itemId) {
      return repository.findById(organizationId, itemId);
    },

    async listByStatus(organizationId, status) {
      return repository.findByStatus(organizationId, status);
    },
  };
}
