/** Real, in-memory {@link NotificationRepository} implementation. @module notification/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Notification } from './types.js';
import type { NotificationRepository } from './repository.js';

/** Creates a real, in-memory {@link NotificationRepository}. */
export function createNotificationRepository(seed?: readonly Notification[]): NotificationRepository {
  const repo = createInMemoryRepository<Notification>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((notification) => notification.status === status);
    },
    async findByType(organizationId, notificationType) {
      return repo.list(organizationId).filter((notification) => notification.notificationType === notificationType);
    },
    async findByRecipient(organizationId, recipientId) {
      return repo.list(organizationId).filter((notification) => notification.recipientId === recipientId);
    },
  };
}
