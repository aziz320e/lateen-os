/** @module knowledge/repository */
import type { KnowledgeEntryVersionId, OrganizationId, KnowledgeEntryId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MemorySourceLabel, MemoryTag } from '../shared/primitives.js';
import type { KnowledgeEntry, KnowledgeEntryStatus, KnowledgeEntryVersion, KnowledgeType } from './types.js';

export interface KnowledgeEntryRepository extends Repository<KnowledgeEntry, KnowledgeEntryId> {
  findByType(
    organizationId: OrganizationId,
    knowledgeType: KnowledgeType,
  ): Promise<readonly KnowledgeEntry[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: KnowledgeEntryStatus,
  ): Promise<readonly KnowledgeEntry[]>;
  /** Entries matching any of the given tags. */
  findByTags(organizationId: OrganizationId, tags: readonly MemoryTag[]): Promise<readonly KnowledgeEntry[]>;
  findBySource(organizationId: OrganizationId, source: MemorySourceLabel): Promise<readonly KnowledgeEntry[]>;
  findByOrganization(organizationId: OrganizationId): Promise<readonly KnowledgeEntry[]>;
}

/** Persistence port for the immutable {@link KnowledgeEntryVersion} log. */
export interface KnowledgeEntryVersionRepository extends Repository<KnowledgeEntryVersion, KnowledgeEntryVersionId> {
  findByKnowledgeEntry(organizationId: OrganizationId, knowledgeEntryId: KnowledgeEntryId): Promise<readonly KnowledgeEntryVersion[]>;
}
