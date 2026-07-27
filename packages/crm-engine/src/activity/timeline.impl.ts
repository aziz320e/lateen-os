/**
 * Real Activity Timeline — logs calls, meetings, emails, notes, and tasks
 * against any CRM record, and returns them in deterministic chronological
 * order.
 *
 * @module activity/timeline.impl
 */
import type { CrmEventBus } from '../events/crm-event-bus.js';
import { ActivityNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { ActivityId, EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { ActivityRepository } from './repository.js';
import type { Activity, ActivityRelatedEntity, ActivityType } from './types.js';

export interface LogActivityInput {
  readonly activityType: ActivityType;
  readonly subject: string;
  readonly notes?: string;
  readonly relatedTo: ActivityRelatedEntity;
  readonly authorId?: EmployeeId;
  readonly occurredAt?: ISODateTime;
  readonly dueAt?: ISODateTime;
}

export interface ActivityTimeline {
  log(organizationId: OrganizationId, input: LogActivityInput): Promise<Activity>;
  /** Marks a `'task'` activity complete. */
  complete(organizationId: OrganizationId, activityId: ActivityId): Promise<Activity>;
  /** Every activity for a related entity, most recent first. */
  listByEntity(organizationId: OrganizationId, entityType: ActivityRelatedEntity['entityType'], entityId: string): Promise<readonly Activity[]>;
  get(organizationId: OrganizationId, activityId: ActivityId): Promise<Activity | null>;
}

/** Creates a real {@link ActivityTimeline} backed by an {@link ActivityRepository}. */
export function createActivityTimeline(repository: ActivityRepository, eventBus?: CrmEventBus, now: () => string = nowIso): ActivityTimeline {
  return {
    async log(organizationId, input) {
      const timestamp = now();
      const activity: Activity = {
        id: generateId('activity'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        activityType: input.activityType,
        subject: input.subject,
        notes: input.notes,
        relatedTo: input.relatedTo,
        authorId: input.authorId,
        occurredAt: input.occurredAt ?? timestamp,
        dueAt: input.dueAt,
        completed: input.activityType === 'task' ? false : undefined,
      };
      await repository.save(activity);
      eventBus?.publish('activity.logged', { activityId: activity.id, organizationId, activityType: activity.activityType });
      return activity;
    },

    async complete(organizationId, activityId) {
      const activity = await repository.findById(organizationId, activityId);
      if (!activity) throw new ActivityNotFoundError(activityId);
      const updated: Activity = { ...activity, completed: true, updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async listByEntity(organizationId, entityType, entityId) {
      const activities = await repository.findByRelatedEntity(organizationId, entityType, entityId);
      return [...activities].sort((a, b) => (a.occurredAt < b.occurredAt ? 1 : a.occurredAt > b.occurredAt ? -1 : 0));
    },

    async get(organizationId, activityId) {
      return repository.findById(organizationId, activityId);
    },
  };
}
