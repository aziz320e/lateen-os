/** @module notifications/repository */
import type { Repository } from '../shared/repository.js';
import type { WorkforceNotification, WorkforceNotificationId } from './types.js';

export type WorkforceNotificationRepository = Repository<WorkforceNotification, WorkforceNotificationId>;
