/** Real, in-memory Feedback repository. @module feedback/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { FeedbackEntryRepository } from './repository.js';
import type { FeedbackEntry } from './types.js';

/** Creates a real, in-memory {@link FeedbackEntryRepository}. */
export function createFeedbackEntryRepository(seed?: readonly FeedbackEntry[]): FeedbackEntryRepository {
  const repo = createInMemoryRepository<FeedbackEntry>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByCustomer(organizationId, customerId) {
      return repo.list(organizationId).filter((entry) => entry.customerId === customerId);
    },
    async findByType(organizationId, feedbackType) {
      return repo.list(organizationId).filter((entry) => entry.feedbackType === feedbackType);
    },
  };
}
