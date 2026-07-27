/**
 * Real Sales Activities timeline — logs meetings, calls, emails, demos,
 * and follow-ups against any sales record, and returns them in
 * deterministic chronological order.
 *
 * @module activity/timeline.impl
 */
import { SalesActivityNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { EmployeeId, OrganizationId, SalesActivityId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';
import type { SalesActivityRepository } from './repository.js';
import type { SalesActivity, SalesActivityRelatedEntity, SalesActivityType, SalesRelatedEntityType } from './types.js';

export interface LogSalesActivityInput {
  readonly activityType: SalesActivityType;
  readonly subject: string;
  readonly notes?: string;
  readonly relatedTo: SalesActivityRelatedEntity;
  readonly authorId?: EmployeeId;
  readonly occurredAt?: ISODateTime;
  readonly dueAt?: ISODateTime;
}

export interface SalesActivityTimeline {
  log(organizationId: OrganizationId, input: LogSalesActivityInput): Promise<SalesActivity>;
  /** Marks a `'follow_up'` activity complete. */
  complete(organizationId: OrganizationId, activityId: SalesActivityId): Promise<SalesActivity>;
  /** Every activity for a related entity, most recent first. */
  listByEntity(organizationId: OrganizationId, entityType: SalesRelatedEntityType, entityId: string): Promise<readonly SalesActivity[]>;
  get(organizationId: OrganizationId, activityId: SalesActivityId): Promise<SalesActivity | null>;
}

/** Creates a real {@link SalesActivityTimeline} backed by a {@link SalesActivityRepository}. */
export function createSalesActivityTimeline(repository: SalesActivityRepository, now: () => string = nowIso): SalesActivityTimeline {
  return {
    async log(organizationId, input) {
      const timestamp = now();
      const activity: SalesActivity = {
        id: generateId('sales-activity'),
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
        completed: input.activityType === 'follow_up' ? false : undefined,
      };
      await repository.save(activity);
      return activity;
    },

    async complete(organizationId, activityId) {
      const activity = await repository.findById(organizationId, activityId);
      if (!activity) throw new SalesActivityNotFoundError(activityId);
      const updated: SalesActivity = { ...activity, completed: true, updatedAt: now() };
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
