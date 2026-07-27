/** @module calendar/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { CalendarEntryId, CampaignId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { CalendarEntryId };

export type RecurrenceFrequency = 'daily' | 'weekly' | 'monthly';

/** A deterministic recurrence rule — every `interval` units, optionally capped at `count` occurrences. */
export interface RecurrenceRule {
  readonly frequency: RecurrenceFrequency;
  readonly interval: number;
  readonly count?: number;
}

export type CalendarEntryStatus = 'scheduled' | 'cancelled';

/** A marketing calendar entry — a one-off or recurring campaign launch window. */
export interface CalendarEntry extends TenantAuditableEntity<CalendarEntryId> {
  readonly title: string;
  readonly campaignId?: CampaignId;
  readonly status: CalendarEntryStatus;
  readonly startAt: ISODateTime;
  /** The end of this occurrence's launch window. */
  readonly endAt?: ISODateTime;
  readonly recurrence?: RecurrenceRule;
}

export type { OrganizationId } from '../shared/identifiers.js';
