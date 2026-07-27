import { describe, expect, it } from 'vitest';
import { createSalesActivityRepository } from '../src/activity/repository.impl.js';
import { createSalesActivityTimeline } from '../src/activity/timeline.impl.js';
import { SalesActivityNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup() {
  const repository = createSalesActivityRepository();
  const timeline = createSalesActivityTimeline(repository);
  return { repository, timeline };
}

describe('createSalesActivityTimeline', () => {
  it('log() records a meeting related to an opportunity', async () => {
    const { timeline } = setup();
    const activity = await timeline.log(ORG, {
      activityType: 'meeting',
      subject: 'Discovery call',
      relatedTo: { entityType: 'opportunity', entityId: 'opp-1' },
    });
    expect(activity.activityType).toBe('meeting');
    expect(activity.relatedTo).toEqual({ entityType: 'opportunity', entityId: 'opp-1' });
  });

  it('log() supports call, email, and demo types', async () => {
    const { timeline } = setup();
    for (const activityType of ['call', 'email', 'demo'] as const) {
      const activity = await timeline.log(ORG, {
        activityType,
        subject: `A ${activityType}`,
        relatedTo: { entityType: 'opportunity', entityId: 'opp-1' },
      });
      expect(activity.activityType).toBe(activityType);
      expect(activity.completed).toBeUndefined();
    }
  });

  it('log() defaults occurredAt to now() when not given', async () => {
    const { timeline } = setup();
    const before = new Date().toISOString();
    const activity = await timeline.log(ORG, {
      activityType: 'call',
      subject: 'Call',
      relatedTo: { entityType: 'opportunity', entityId: 'opp-1' },
    });
    expect(activity.occurredAt >= before).toBe(true);
  });

  it('log() honors an explicit occurredAt for backdating', async () => {
    const { timeline } = setup();
    const activity = await timeline.log(ORG, {
      activityType: 'call',
      subject: 'Backdated call',
      relatedTo: { entityType: 'opportunity', entityId: 'opp-1' },
      occurredAt: '2020-01-01T00:00:00.000Z',
    });
    expect(activity.occurredAt).toBe('2020-01-01T00:00:00.000Z');
  });

  it('log() starts a follow_up as not completed', async () => {
    const { timeline } = setup();
    const activity = await timeline.log(ORG, {
      activityType: 'follow_up',
      subject: 'Check in',
      relatedTo: { entityType: 'quote', entityId: 'quote-1' },
    });
    expect(activity.completed).toBe(false);
  });

  it('complete() marks a follow_up done', async () => {
    const { timeline } = setup();
    const activity = await timeline.log(ORG, {
      activityType: 'follow_up',
      subject: 'Check in',
      relatedTo: { entityType: 'quote', entityId: 'quote-1' },
    });
    const completed = await timeline.complete(ORG, activity.id);
    expect(completed.completed).toBe(true);
  });

  it('throws SalesActivityNotFoundError for an unknown activity', async () => {
    const { timeline } = setup();
    await expect(timeline.complete(ORG, 'missing')).rejects.toBeInstanceOf(SalesActivityNotFoundError);
  });

  it('listByEntity() returns activities most recent first', async () => {
    const { timeline } = setup();
    await timeline.log(ORG, { activityType: 'call', subject: 'First', relatedTo: { entityType: 'opportunity', entityId: 'opp-1' }, occurredAt: '2024-01-01T00:00:00.000Z' });
    await timeline.log(ORG, { activityType: 'email', subject: 'Second', relatedTo: { entityType: 'opportunity', entityId: 'opp-1' }, occurredAt: '2024-03-01T00:00:00.000Z' });
    await timeline.log(ORG, { activityType: 'demo', subject: 'Third', relatedTo: { entityType: 'opportunity', entityId: 'opp-1' }, occurredAt: '2024-02-01T00:00:00.000Z' });

    const activities = await timeline.listByEntity(ORG, 'opportunity', 'opp-1');
    expect(activities.map((activity) => activity.subject)).toEqual(['Second', 'Third', 'First']);
  });

  it('listByEntity() only returns activities for the given entity', async () => {
    const { timeline } = setup();
    await timeline.log(ORG, { activityType: 'call', subject: 'A', relatedTo: { entityType: 'opportunity', entityId: 'opp-1' } });
    await timeline.log(ORG, { activityType: 'call', subject: 'B', relatedTo: { entityType: 'opportunity', entityId: 'opp-2' } });

    const activities = await timeline.listByEntity(ORG, 'opportunity', 'opp-1');
    expect(activities).toHaveLength(1);
    expect(activities[0]?.subject).toBe('A');
  });

  it('get() returns null for an unknown activity', async () => {
    const { timeline } = setup();
    expect(await timeline.get(ORG, 'missing')).toBeNull();
  });

  it('is organization-scoped', async () => {
    const { repository, timeline } = setup();
    const activity = await timeline.log(ORG, { activityType: 'call', subject: 'Call', relatedTo: { entityType: 'opportunity', entityId: 'opp-1' } });
    expect(await repository.findById('org-2', activity.id)).toBeNull();
  });
});
