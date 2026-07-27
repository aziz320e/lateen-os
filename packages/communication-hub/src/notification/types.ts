/** @module notification/types */
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { ConversationId, NotificationId } from '../shared/identifiers.js';
import type { ISODateTime } from '../shared/primitives.js';

export type { NotificationId };

/** Deterministic notification kind. */
export type NotificationType = 'user' | 'team' | 'workflow' | 'reminder' | 'escalation';

export type NotificationStatus = 'pending' | 'sent' | 'read' | 'cancelled';

/** A single deterministic notification. */
export interface Notification extends TenantAuditableEntity<NotificationId> {
  readonly notificationType: NotificationType;
  readonly status: NotificationStatus;
  /** External reference id — a user, employee, or team id, depending on `notificationType`. */
  readonly recipientId?: string;
  readonly title: string;
  readonly body?: string;
  readonly relatedConversationId?: ConversationId;
  readonly sentAt?: ISODateTime;
  readonly readAt?: ISODateTime;
}

export type { OrganizationId } from '../shared/identifiers.js';
