/** @module knowledge/repository */
import type { OrganizationId, KnowledgeEntryId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { KnowledgeEntry, KnowledgeEntryStatus, KnowledgeType } from './types.js';

export interface KnowledgeEntryRepository extends Repository<KnowledgeEntry, KnowledgeEntryId> {
  findByType(
    organizationId: OrganizationId,
    knowledgeType: KnowledgeType,
  ): Promise<readonly KnowledgeEntry[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: KnowledgeEntryStatus,
  ): Promise<readonly KnowledgeEntry[]>;
}
