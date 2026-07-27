/**
 * Real Marketing Calendar — deterministic schedules, recurring campaigns,
 * and launch windows.
 *
 * @module calendar/service.impl
 */
import { CalendarEntryNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { CalendarEntryId, CampaignId, OrganizationId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { CalendarRepository } from './repository.js';
import type { CalendarEntry, RecurrenceRule } from './types.js';

function addInterval(date: Date, frequency: RecurrenceRule['frequency'], interval: number): Date {
  const next = new Date(date.getTime());
  if (frequency === 'daily') next.setUTCDate(next.getUTCDate() + interval);
  else if (frequency === 'weekly') next.setUTCDate(next.getUTCDate() + interval * 7);
  else next.setUTCMonth(next.getUTCMonth() + interval);
  return next;
}

/** Pure, deterministic occurrence expansion — a non-recurring entry yields at most one occurrence. */
export function generateOccurrences(
  entry: Pick<CalendarEntry, 'startAt' | 'recurrence'>,
  rangeStart: ISODateTime,
  rangeEnd: ISODateTime,
): readonly ISODateTime[] {
  const rangeStartDate = new Date(rangeStart);
  const rangeEndDate = new Date(rangeEnd);
  const start = new Date(entry.startAt);

  if (!entry.recurrence) {
    return start >= rangeStartDate && start <= rangeEndDate ? [entry.startAt] : [];
  }

  const occurrences: string[] = [];
  const maxCount = entry.recurrence.count ?? Number.POSITIVE_INFINITY;
  let current = start;
  let count = 0;
  while (current <= rangeEndDate && count < maxCount) {
    if (current >= rangeStartDate) occurrences.push(current.toISOString());
    current = addInterval(current, entry.recurrence.frequency, entry.recurrence.interval);
    count += 1;
  }
  return occurrences;
}

export interface ScheduleCalendarEntryInput {
  readonly title: string;
  readonly campaignId?: CampaignId;
  readonly startAt: ISODateTime;
  readonly endAt?: ISODateTime;
  readonly recurrence?: RecurrenceRule;
}

export interface UpdateCalendarEntryInput {
  readonly title?: string;
  readonly startAt?: ISODateTime;
  readonly endAt?: ISODateTime;
  readonly recurrence?: RecurrenceRule;
}

export interface MarketingCalendarService {
  scheduleEntry(organizationId: OrganizationId, input: ScheduleCalendarEntryInput): Promise<CalendarEntry>;
  updateEntry(organizationId: OrganizationId, entryId: CalendarEntryId, patch: UpdateCalendarEntryInput): Promise<CalendarEntry>;
  cancelEntry(organizationId: OrganizationId, entryId: CalendarEntryId): Promise<CalendarEntry>;
  getEntry(organizationId: OrganizationId, entryId: CalendarEntryId): Promise<CalendarEntry | null>;
  listByCampaign(organizationId: OrganizationId, campaignId: CampaignId): Promise<readonly CalendarEntry[]>;
  /** Every occurrence (expanding recurrence rules) across every entry, falling within `[rangeStart, rangeEnd]`. */
  listOccurrencesInRange(
    organizationId: OrganizationId,
    rangeStart: ISODateTime,
    rangeEnd: ISODateTime,
  ): Promise<ReadonlyMap<CalendarEntryId, readonly ISODateTime[]>>;
}

/** Creates a real {@link MarketingCalendarService} backed by a {@link CalendarRepository}. */
export function createMarketingCalendarService(repository: CalendarRepository, now: () => string = nowIso): MarketingCalendarService {
  async function requireEntry(organizationId: OrganizationId, entryId: CalendarEntryId): Promise<CalendarEntry> {
    const entry = await repository.findById(organizationId, entryId);
    if (!entry) throw new CalendarEntryNotFoundError(entryId);
    return entry;
  }

  return {
    async scheduleEntry(organizationId, input) {
      const timestamp = now();
      const entry: CalendarEntry = {
        id: generateId('calendar-entry'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: input.title,
        campaignId: input.campaignId,
        status: 'scheduled',
        startAt: input.startAt,
        endAt: input.endAt,
        recurrence: input.recurrence,
      };
      await repository.save(entry);
      return entry;
    },

    async updateEntry(organizationId, entryId, patch) {
      const entry = await requireEntry(organizationId, entryId);
      const updated: CalendarEntry = {
        ...entry,
        title: patch.title ?? entry.title,
        startAt: patch.startAt ?? entry.startAt,
        endAt: patch.endAt ?? entry.endAt,
        recurrence: patch.recurrence ?? entry.recurrence,
        updatedAt: now(),
      };
      await repository.save(updated);
      return updated;
    },

    async cancelEntry(organizationId, entryId) {
      const entry = await requireEntry(organizationId, entryId);
      const updated: CalendarEntry = { ...entry, status: 'cancelled', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async getEntry(organizationId, entryId) {
      return repository.findById(organizationId, entryId);
    },

    async listByCampaign(organizationId, campaignId) {
      return repository.findByCampaign(organizationId, campaignId);
    },

    async listOccurrencesInRange(organizationId, rangeStart, rangeEnd) {
      const entries = await repository.findAll(organizationId);
      const occurrencesByEntry = new Map<CalendarEntryId, readonly ISODateTime[]>();
      for (const entry of entries) {
        if (entry.status === 'cancelled') continue;
        const occurrences = generateOccurrences(entry, rangeStart, rangeEnd);
        if (occurrences.length > 0) occurrencesByEntry.set(entry.id, occurrences);
      }
      return occurrencesByEntry;
    },
  };
}
