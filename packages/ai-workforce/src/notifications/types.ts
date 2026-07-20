/** @module notifications/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  OrganizationId,
  WorkerId,
  WorkforceNotificationId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { WorkforceNotificationId };

export type NotificationChannel = 'in_app' | 'email' | 'webhook' | 'nats';

export type NotificationPriority = 'critical' | 'high' | 'normal' | 'low';

export type NotificationCategory =
  | 'assignment'
  | 'delegation'
  | 'review'
  | 'escalation'
  | 'goal'
  | 'performance'
  | 'governance'
  | 'system';

export type NotificationStatus = 'pending' | 'delivered' | 'read' | 'dismissed' | 'failed';

/** Workforce notification to a worker or supervisor. */
export interface WorkforceNotification extends TenantAuditableEntity<WorkforceNotificationId> {
  readonly recipientWorkerId?: WorkerId;
  readonly recipientEmployeeId?: string;
  readonly category: NotificationCategory;
  readonly priority: NotificationPriority;
  readonly channel: NotificationChannel;
  readonly title: string;
  readonly body: string;
  readonly referenceType?: string;
  readonly referenceId?: string;
  readonly status: NotificationStatus;
  readonly sentAt?: Timestamp;
  readonly readAt?: Timestamp;
}

export type { OrganizationId, WorkerId };
