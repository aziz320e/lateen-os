/** @module memory/repository */
import type { OrganizationId, RuntimeSessionId, WorkingMemoryId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { WorkingMemory } from './types.js';

export interface WorkingMemoryRepository extends Repository<WorkingMemory, WorkingMemoryId> {
  findBySession(
    organizationId: OrganizationId,
    sessionId: RuntimeSessionId,
  ): Promise<WorkingMemory | null>;
}
