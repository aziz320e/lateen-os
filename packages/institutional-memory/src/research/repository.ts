/** @module research/repository */
import type { OrganizationId, ResearchRecordId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { MemoryTag } from '../shared/primitives.js';
import type { ResearchRecord, ResearchRecordStatus } from './types.js';

export interface ResearchRecordRepository extends Repository<ResearchRecord, ResearchRecordId> {
  findByTopic(organizationId: OrganizationId, topic: string): Promise<readonly ResearchRecord[]>;
  findByTag(organizationId: OrganizationId, tag: MemoryTag): Promise<readonly ResearchRecord[]>;
  findByStatus(
    organizationId: OrganizationId,
    status: ResearchRecordStatus,
  ): Promise<readonly ResearchRecord[]>;
}
