/** Real, in-memory {@link CalendarRepository} implementation. @module calendar/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { CalendarEntry } from './types.js';
import type { CalendarRepository } from './repository.js';

/** Creates a real, in-memory {@link CalendarRepository}. */
export function createCalendarRepository(seed?: readonly CalendarEntry[]): CalendarRepository {
  const repo = createInMemoryRepository<CalendarEntry>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCampaign(organizationId, campaignId) {
      return repo.list(organizationId).filter((entry) => entry.campaignId === campaignId);
    },
  };
}
