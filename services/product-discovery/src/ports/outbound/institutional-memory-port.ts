/** @module ports/outbound/institutional-memory-port */
import type { KnowledgeEntry } from '@lateen-os/institutional-memory';
import type { KnowledgeEntryId, OrganizationId } from '../../domain/identifiers.js';

/** Outbound port to Institutional Memory — historical knowledge and evidence. */
export interface InstitutionalMemoryPort {
  findKnowledgeByTopic(
    organizationId: OrganizationId,
    topic: string,
  ): Promise<readonly KnowledgeEntry[]>;

  getKnowledgeEntry(
    organizationId: OrganizationId,
    entryId: KnowledgeEntryId,
  ): Promise<KnowledgeEntry | null>;
}
