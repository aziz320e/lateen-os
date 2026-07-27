import { describe, expect, it, vi } from 'vitest';
import { createActivityRepository } from '../src/activity/repository.impl.js';
import { createActivityTimeline } from '../src/activity/timeline.impl.js';
import { createCrmEventBus } from '../src/events/crm-event-bus.js';
import { ActivityNotFoundError } from '../src/shared/errors.js';

const ORG = 'org-1';

function setup(eventBus = createCrmEventBus()) {
  const repository = createActivityRepository();
  const timeline = createActivityTimeline(repository, eventBus);
  return { repository, timeline, eventBus };
}

describe('createActivityTimeline', () => {
  it('log() records a call activity related to a customer', async () => {
    const { timeline } = setup();
    const activity = await timeline.log(ORG, {
      activityType: 'call',
      subject: 'Kickoff call',
      relatedTo: { entityType: 'customer', entityId: 'customer-1' },
    });
    expect(activity.activityType).toBe('call');
    expect(activity.relatedTo).toEqual({ entityType: 'customer', entityId: 'customer-1' });
  });

  it('log() supports meeting, email, and note types', async () => {
    const { timeline } = setup();
    for (const activityType of ['meeting', 'email', 'note'] as const) {
      const activity = await timeline.log(ORG, {
        activityType,
        subject: `A ${activityType}`,
        relatedTo: { entityType: 'lead', entityId: 'lead-1' },
      });
      expect(activity.activityType).toBe(activityType);
      expect(activity.completed).toBeUndefined();
    }
  });

  it('log() defaults occurredAt to now() when not given', async () => {
    const { timeline } = setup(createCrmEventBus());
    const before = new Date().toISOString();
    const activity = await timeline.log(ORG, {
      activityType: 'note',
      subject: 'Note',
      relatedTo: { entityType: 'customer', entityId: 'customer-1' },
    });
    expect(activity.occurredAt >= before).toBe(true);
  });

  it('log() honors an explicit occurredAt for backdating', async () => {
    const { timeline } = setup();
    const activity = await timeline.log(ORG, {
      activityType: 'call',
      subject: 'Backdated call',
      relatedTo: { entityType: 'customer', entityId: 'customer-1' },
      occurredAt: '2020-01-01T00:00:00.000Z',
    });
    expect(activity.occurredAt).toBe('2020-01-01T00:00:00.000Z');
  });

  it('log() starts a task as not completed', async () => {
    const { timeline } = setup();
    const activity = await timeline.log(ORG, {
      activityType: 'task',
      subject: 'Follow up',
      relatedTo: { entityType: 'opportunity', entityId: 'opportunity-1' },
    });
    expect(activity.completed).toBe(false);
  });

  it('complete() marks a task done', async () => {
    const { timeline } = setup();
    const activity = await timeline.log(ORG, {
      activityType: 'task',
      subject: 'Follow up',
      relatedTo: { entityType: 'opportunity', entityId: 'opportunity-1' },
    });
    const completed = await timeline.complete(ORG, activity.id);
    expect(completed.completed).toBe(true);
  });

  it('throws ActivityNotFoundError for an unknown activity', async () => {
    const { timeline } = setup();
    await expect(timeline.complete(ORG, 'missing')).rejects.toBeInstanceOf(ActivityNotFoundError);
  });

  it('listByEntity() returns activities most recent first', async () => {
    const { timeline } = setup();
    await timeline.log(ORG, { activityType: 'call', subject: 'First', relatedTo: { entityType: 'customer', entityId: 'customer-1' }, occurredAt: '2024-01-01T00:00:00.000Z' });
    await timeline.log(ORG, { activityType: 'email', subject: 'Second', relatedTo: { entityType: 'customer', entityId: 'customer-1' }, occurredAt: '2024-03-01T00:00:00.000Z' });
    await timeline.log(ORG, { activityType: 'note', subject: 'Third', relatedTo: { entityType: 'customer', entityId: 'customer-1' }, occurredAt: '2024-02-01T00:00:00.000Z' });

    const activities = await timeline.listByEntity(ORG, 'customer', 'customer-1');
    expect(activities.map((activity) => activity.subject)).toEqual(['Second', 'Third', 'First']);
  });

  it('listByEntity() only returns activities for the given entity', async () => {
    const { timeline } = setup();
    await timeline.log(ORG, { activityType: 'call', subject: 'A', relatedTo: { entityType: 'customer', entityId: 'customer-1' } });
    await timeline.log(ORG, { activityType: 'call', subject: 'B', relatedTo: { entityType: 'customer', entityId: 'customer-2' } });

    const activities = await timeline.listByEntity(ORG, 'customer', 'customer-1');
    expect(activities).toHaveLength(1);
    expect(activities[0]?.subject).toBe('A');
  });

  it('publishes activity.logged', async () => {
    const eventBus = createCrmEventBus();
    const logged = vi.fn();
    eventBus.subscribe('activity.logged', logged);
    const { timeline } = setup(eventBus);

    await timeline.log(ORG, { activityType: 'call', subject: 'Kickoff', relatedTo: { entityType: 'customer', entityId: 'customer-1' } });
    await Promise.resolve();

    expect(logged).toHaveBeenCalledTimes(1);
  });

  it('is organization-scoped', async () => {
    const { repository, timeline } = setup();
    const activity = await timeline.log(ORG, { activityType: 'call', subject: 'Kickoff', relatedTo: { entityType: 'customer', entityId: 'customer-1' } });
    expect(await repository.findById('org-2', activity.id)).toBeNull();
  });

  it('get() returns null for an unknown activity', async () => {
    const { timeline } = setup();
    expect(await timeline.get(ORG, 'missing')).toBeNull();
  });
});
