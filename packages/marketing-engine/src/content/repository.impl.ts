/** Real, in-memory {@link ContentRepository} implementation. @module content/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ContentItem } from './types.js';
import type { ContentRepository } from './repository.js';

/** Creates a real, in-memory {@link ContentRepository}. */
export function createContentRepository(seed?: readonly ContentItem[]): ContentRepository {
  const repo = createInMemoryRepository<ContentItem>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, contentType) {
      return repo.list(organizationId).filter((item) => item.contentType === contentType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((item) => item.status === status);
    },
    async findByCampaign(organizationId, campaignId) {
      return repo.list(organizationId).filter((item) => item.campaignId === campaignId);
    },
  };
}
