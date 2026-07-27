/** Real, in-memory {@link ScheduledItemRepository} implementation. @module scheduling/repository.impl */
import type { ScheduledItemRepository } from './repository.js';
import type { ScheduledItem } from './types.js';

/** Creates a real, in-memory {@link ScheduledItemRepository}. */
export function createScheduledItemRepository(seed?: readonly ScheduledItem[]): ScheduledItemRepository {
  const store = new Map<string, ScheduledItem>();
  for (const item of seed ?? []) store.set(item.id, item);

  return {
    async save(item) {
      store.set(item.id, item);
    },
    async findById(organizationId, itemId) {
      const item = store.get(itemId);
      if (!item || item.organizationId !== organizationId) return null;
      return item;
    },
    async findAll(organizationId) {
      return [...store.values()].filter((item) => item.organizationId === organizationId);
    },
    async findByStatus(organizationId, status) {
      return [...store.values()].filter((item) => item.organizationId === organizationId && item.status === status);
    },
  };
}
