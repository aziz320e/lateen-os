/** @module meeting/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  ActionItemId,
  DecisionRecordId,
  EmployeeId,
  MeetingRecordId,
  OrganizationId,
} from '../shared/identifiers.js';
import type { Timestamp } from '@lateen-os/shared-kernel/time';

export type { MeetingRecordId };

export type MeetingRecordStatus = 'scheduled' | 'completed' | 'cancelled' | 'archived';

/** Action item captured during a meeting. */
export interface ActionItem {
  readonly actionItemId: ActionItemId;
  readonly description: string;
  readonly assigneeId?: EmployeeId;
  readonly dueAt?: Timestamp;
  readonly completed: boolean;
}

/** Record of a meeting and its institutional outcomes. */
export interface MeetingRecord extends TenantAuditableEntity<MeetingRecordId> {
  readonly title: string;
  readonly heldAt: Timestamp;
  readonly attendees: readonly EmployeeId[];
  readonly topics: readonly string[];
  readonly notes: string;
  readonly actionItems: readonly ActionItem[];
  readonly decisionIds: readonly DecisionRecordId[];
  readonly status: MeetingRecordStatus;
}

export type { OrganizationId };
