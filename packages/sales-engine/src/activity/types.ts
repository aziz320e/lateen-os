/** @module activity/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { EmployeeId, SalesActivityId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { SalesActivityId };

export type SalesActivityType = 'meeting' | 'call' | 'email' | 'demo' | 'follow_up';

export type SalesRelatedEntityType = 'opportunity' | 'quote';

/** Reference to the sales record an activity is attached to. */
export interface SalesActivityRelatedEntity {
  readonly entityType: SalesRelatedEntityType;
  readonly entityId: string;
}

/** A single entry in a sales opportunity's or quote's activity timeline. */
export interface SalesActivity extends TenantAuditableEntity<SalesActivityId> {
  readonly activityType: SalesActivityType;
  readonly subject: string;
  readonly notes?: string;
  readonly relatedTo: SalesActivityRelatedEntity;
  readonly authorId?: EmployeeId;
  readonly occurredAt: ISODateTime;
  readonly dueAt?: ISODateTime;
  readonly completed?: boolean;
}

export type { OrganizationId } from '../shared/identifiers.js';
