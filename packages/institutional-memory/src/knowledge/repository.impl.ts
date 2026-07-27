/** Real, in-memory {@link KnowledgeEntryRepository} / {@link KnowledgeEntryVersionRepository} implementations. @module knowledge/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { KnowledgeEntry, KnowledgeEntryVersion } from './types.js';
import type { KnowledgeEntryRepository, KnowledgeEntryVersionRepository } from './repository.js';

/** Creates a real, in-memory {@link KnowledgeEntryRepository}. */
export function createKnowledgeEntryRepository(seed?: readonly KnowledgeEntry[]): KnowledgeEntryRepository {
  const repo = createInMemoryRepository<KnowledgeEntry>({ seed });
  return {
    ...repo,
    async findByType(organizationId, knowledgeType) {
      return repo.list(organizationId).filter((entry) => entry.knowledgeType === knowledgeType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((entry) => entry.status === status);
    },
    async findByTags(organizationId, tags) {
      const tagSet = new Set(tags);
      return repo.list(organizationId).filter((entry) => entry.tags.some((tag) => tagSet.has(tag)));
    },
    async findBySource(organizationId, source) {
      return repo.list(organizationId).filter((entry) => entry.source === source);
    },
    async findByOrganization(organizationId) {
      return repo.list(organizationId);
    },
  };
}

/** Creates a real, in-memory {@link KnowledgeEntryVersionRepository}. */
export function createKnowledgeEntryVersionRepository(seed?: readonly KnowledgeEntryVersion[]): KnowledgeEntryVersionRepository {
  const repo = createInMemoryRepository<KnowledgeEntryVersion>({ seed });
  return {
    ...repo,
    async findByKnowledgeEntry(organizationId, knowledgeEntryId) {
      return repo
        .list(organizationId)
        .filter((version) => version.knowledgeEntryId === knowledgeEntryId)
        .sort((a, b) => a.revisionNumber - b.revisionNumber);
    },
  };
}
