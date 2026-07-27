/** @module activity/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ActivityId, EmployeeId, OrganizationId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { ActivityId };

export type ActivityType = 'call' | 'meeting' | 'email' | 'note' | 'task';

export type RelatedEntityType = 'customer' | 'lead' | 'contact' | 'account' | 'opportunity';

/** Reference to the CRM record an activity is attached to. */
export interface ActivityRelatedEntity {
  readonly entityType: RelatedEntityType;
  readonly entityId: string;
}

/** A single entry in a CRM record's activity timeline. */
export interface Activity extends TenantAuditableEntity<ActivityId> {
  readonly activityType: ActivityType;
  readonly subject: string;
  readonly notes?: string;
  readonly relatedTo: ActivityRelatedEntity;
  readonly authorId?: EmployeeId;
  readonly occurredAt: ISODateTime;
  /** Only meaningful for `activityType: 'task'`. */
  readonly dueAt?: ISODateTime;
  readonly completed?: boolean;
}

export type { OrganizationId };
