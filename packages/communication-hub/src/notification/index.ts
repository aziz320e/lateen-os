/**
 * Notifications — user, team, workflow, reminder, and escalation
 * notifications.
 * @module notification
 */
export * from './types.js';
export * from './repository.js';
export { createNotificationRepository } from './repository.impl.js';
export {
  createNotificationService,
  canTransitionNotification,
  type NotificationService,
  type CreateNotificationInput,
} from './service.impl.js';
