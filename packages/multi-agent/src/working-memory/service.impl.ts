/**
 * Real Shared Working Memory — a mission-scoped blackboard multiple agents
 * read and write during collaboration. Distinct from Shared Business
 * Context (a versioned business-data snapshot): this is a lightweight,
 * per-key store for in-flight coordination state.
 *
 * @module working-memory/service.impl
 */
import { generateId, nowIso } from '../shared/id.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { SharedWorkingMemoryRepository } from './repository.js';
import type { SharedWorkingMemoryEntry, WorkerId } from './types.js';

export interface SharedWorkingMemoryService {
  set(organizationId: OrganizationId, missionId: MissionId, key: string, value: unknown, writerWorkerId: WorkerId): Promise<SharedWorkingMemoryEntry>;
  get(organizationId: OrganizationId, missionId: MissionId, key: string): Promise<SharedWorkingMemoryEntry | null>;
  list(organizationId: OrganizationId, missionId: MissionId): Promise<readonly SharedWorkingMemoryEntry[]>;
  clear(organizationId: OrganizationId, missionId: MissionId, key: string): Promise<void>;
}

/** Creates a real {@link SharedWorkingMemoryService} backed by a {@link SharedWorkingMemoryRepository}. */
export function createSharedWorkingMemoryService(repository: SharedWorkingMemoryRepository): SharedWorkingMemoryService {
  return {
    async set(organizationId, missionId, key, value, writerWorkerId) {
      const existing = await repository.findByKey(organizationId, missionId, key);
      const now = nowIso();
      const entry: SharedWorkingMemoryEntry = existing
        ? { ...existing, value, writerWorkerId, version: existing.version + 1, updatedAt: now }
        : {
            id: generateId('working-memory-entry'),
            organizationId,
            createdAt: now,
            updatedAt: now,
            missionId,
            key,
            value,
            writerWorkerId,
            version: 1,
          };
      await repository.save(entry);
      return entry;
    },

    async get(organizationId, missionId, key) {
      return repository.findByKey(organizationId, missionId, key);
    },

    async list(organizationId, missionId) {
      return repository.findByMission(organizationId, missionId);
    },

    async clear(organizationId, missionId, key) {
      const existing = await repository.findByKey(organizationId, missionId, key);
      if (existing) await repository.delete(organizationId, existing.id);
    },
  };
}
