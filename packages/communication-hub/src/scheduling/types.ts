/** @module scheduling/types */
import type { ScheduledItemId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { ScheduledItemId };

export type ScheduledItemType = 'message' | 'notification';

export type ScheduledItemStatus = 'scheduled' | 'dispatched' | 'cancelled';

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

/** A deterministic recurrence rule — every `interval` units, optionally capped at `count` occurrences. */
export interface RecurrenceRule {
  readonly frequency: RecurrenceFrequency;
  readonly interval: number;
  readonly count?: number;
}

/** A deferred dispatch of an underlying message or notification, optionally recurring. */
export interface ScheduledItem {
  readonly id: ScheduledItemId;
  readonly organizationId: string;
  readonly createdAt: ISODateTime;
  readonly updatedAt: ISODateTime;
  readonly itemType: ScheduledItemType;
  /** The underlying `Message` or `Notification` id this item dispatches. */
  readonly referenceId: string;
  readonly status: ScheduledItemStatus;
  readonly scheduledFor: ISODateTime;
  readonly recurrence?: RecurrenceRule;
  /** 1 for the first occurrence, incremented each time a recurrence reschedules. */
  readonly occurrenceNumber: number;
  readonly dispatchedAt?: ISODateTime;
}
