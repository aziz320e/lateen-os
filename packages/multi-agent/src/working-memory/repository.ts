/** @module working-memory/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { SharedWorkingMemoryEntry, SharedWorkingMemoryEntryId } from './types.js';

export interface SharedWorkingMemoryRepository extends Repository<SharedWorkingMemoryEntry, SharedWorkingMemoryEntryId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly SharedWorkingMemoryEntry[]>;
  findByKey(organizationId: OrganizationId, missionId: MissionId, key: string): Promise<SharedWorkingMemoryEntry | null>;
}
