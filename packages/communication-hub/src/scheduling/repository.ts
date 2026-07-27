/** @module scheduling/repository */
import type { OrganizationId, ScheduledItemId } from '../shared/identifiers.js';
import type { ScheduledItem, ScheduledItemStatus } from './types.js';

export interface ScheduledItemRepository {
  save(item: ScheduledItem): Promise<void>;
  findById(organizationId: OrganizationId, itemId: ScheduledItemId): Promise<ScheduledItem | null>;
  findAll(organizationId: OrganizationId): Promise<readonly ScheduledItem[]>;
  findByStatus(organizationId: OrganizationId, status: ScheduledItemStatus): Promise<readonly ScheduledItem[]>;
}
