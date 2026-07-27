import { describe, expect, it } from 'vitest';
import { createCalendarRepository } from '../src/calendar/repository.impl.js';
import { createMarketingCalendarService, generateOccurrences } from '../src/calendar/service.impl.js';
import { CalendarEntryNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

describe('generateOccurrences (pure)', () => {
  it('yields a single occurrence for a non-recurring entry within range', () => {
    const occurrences = generateOccurrences({ startAt: '2026-03-05T00:00:00.000Z' }, '2026-03-01T00:00:00.000Z', '2026-03-31T00:00:00.000Z');
    expect(occurrences).toEqual(['2026-03-05T00:00:00.000Z']);
  });

  it('yields nothing for a non-recurring entry outside range', () => {
    const occurrences = generateOccurrences({ startAt: '2026-04-05T00:00:00.000Z' }, '2026-03-01T00:00:00.000Z', '2026-03-31T00:00:00.000Z');
    expect(occurrences).toEqual([]);
  });

  it('expands a daily recurrence within range', () => {
    const occurrences = generateOccurrences(
      { startAt: '2026-03-01T00:00:00.000Z', recurrence: { frequency: 'daily', interval: 1 } },
      '2026-03-01T00:00:00.000Z',
      '2026-03-03T00:00:00.000Z',
    );
    expect(occurrences).toHaveLength(3);
  });

  it('expands a weekly recurrence with an interval', () => {
    const occurrences = generateOccurrences(
      { startAt: '2026-03-01T00:00:00.000Z', recurrence: { frequency: 'weekly', interval: 2 } },
      '2026-03-01T00:00:00.000Z',
      '2026-04-01T00:00:00.000Z',
    );
    expect(occurrences).toEqual(['2026-03-01T00:00:00.000Z', '2026-03-15T00:00:00.000Z', '2026-03-29T00:00:00.000Z']);
  });

  it('respects a monthly recurrence count cap', () => {
    const occurrences = generateOccurrences(
      { startAt: '2026-01-01T00:00:00.000Z', recurrence: { frequency: 'monthly', interval: 1, count: 2 } },
      '2026-01-01T00:00:00.000Z',
      '2027-01-01T00:00:00.000Z',
    );
    expect(occurrences).toHaveLength(2);
  });
});

function setup() {
  const repository = createCalendarRepository();
  const service = createMarketingCalendarService(repository);
  return { repository, service };
}

describe('createMarketingCalendarService', () => {
  it('scheduleEntry() creates a scheduled entry', async () => {
    const { service } = setup();
    const entry = await service.scheduleEntry(ORG, { title: 'Spring Launch Window', startAt: '2026-03-01T00:00:00.000Z' });
    expect(entry.status).toBe('scheduled');
  });

  it('updateEntry() merges fields', async () => {
    const { service } = setup();
    const entry = await service.scheduleEntry(ORG, { title: 'Spring Launch Window', startAt: '2026-03-01T00:00:00.000Z' });
    const updated = await service.updateEntry(ORG, entry.id, { title: 'Updated Window' });
    expect(updated.title).toBe('Updated Window');
  });

  it('cancelEntry() sets status cancelled', async () => {
    const { service } = setup();
    const entry = await service.scheduleEntry(ORG, { title: 'Spring Launch Window', startAt: '2026-03-01T00:00:00.000Z' });
    const cancelled = await service.cancelEntry(ORG, entry.id);
    expect(cancelled.status).toBe('cancelled');
  });

  it('throws CalendarEntryNotFoundError for an unknown entry', async () => {
    const { service } = setup();
    await expect(service.cancelEntry(ORG, 'missing')).rejects.toBeInstanceOf(CalendarEntryNotFoundError);
  });

  it('getEntry() returns null for an unknown entry', async () => {
    const { service } = setup();
    expect(await service.getEntry(ORG, 'missing')).toBeNull();
  });

  it('listByCampaign() returns every entry linked to a campaign', async () => {
    const { service } = setup();
    await service.scheduleEntry(ORG, { title: 'A', campaignId: 'campaign-1', startAt: '2026-03-01T00:00:00.000Z' });
    await service.scheduleEntry(ORG, { title: 'B', campaignId: 'campaign-2', startAt: '2026-03-01T00:00:00.000Z' });
    const entries = await service.listByCampaign(ORG, 'campaign-1');
    expect(entries).toHaveLength(1);
  });

  it('listOccurrencesInRange() expands every active entry, excluding cancelled ones', async () => {
    const { service } = setup();
    const daily = await service.scheduleEntry(ORG, {
      title: 'Daily Post',
      startAt: '2026-03-01T00:00:00.000Z',
      recurrence: { frequency: 'daily', interval: 1 },
    });
    const cancelled = await service.scheduleEntry(ORG, { title: 'Cancelled', startAt: '2026-03-01T00:00:00.000Z' });
    await service.cancelEntry(ORG, cancelled.id);

    const occurrences = await service.listOccurrencesInRange(ORG, '2026-03-01T00:00:00.000Z', '2026-03-02T00:00:00.000Z');
    expect(occurrences.has(daily.id)).toBe(true);
    expect(occurrences.has(cancelled.id)).toBe(false);
    expect(occurrences.get(daily.id)).toHaveLength(2);
  });

  it('is organization-scoped', async () => {
    const { repository, service } = setup();
    const entry = await service.scheduleEntry(ORG, { title: 'Spring Launch Window', startAt: '2026-03-01T00:00:00.000Z' });
    expect(await repository.findById('org-2', entry.id)).toBeNull();
  });
});
