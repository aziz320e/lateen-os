/** @module notification/repository */
import type { Repository } from '../shared/repository.js';
import type { NotificationId, OrganizationId } from '../shared/identifiers.js';
import type { Notification, NotificationStatus, NotificationType } from './types.js';

export interface NotificationRepository extends Repository<Notification, NotificationId> {
  findAll(organizationId: OrganizationId): Promise<readonly Notification[]>;
  findByStatus(organizationId: OrganizationId, status: NotificationStatus): Promise<readonly Notification[]>;
  findByType(organizationId: OrganizationId, notificationType: NotificationType): Promise<readonly Notification[]>;
  findByRecipient(organizationId: OrganizationId, recipientId: string): Promise<readonly Notification[]>;
}
