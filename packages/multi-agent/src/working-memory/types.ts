/** @module working-memory/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { MissionId, OrganizationId, SharedWorkingMemoryEntryId } from '../shared/identifiers.js';

export type { SharedWorkingMemoryEntryId, OrganizationId, WorkerId };

/** A single key in a mission's shared working-memory blackboard, writable by any participating agent. */
export interface SharedWorkingMemoryEntry extends TenantAuditableEntity<SharedWorkingMemoryEntryId> {
  readonly missionId: MissionId;
  readonly key: string;
  readonly value: unknown;
  readonly writerWorkerId: WorkerId;
  /** Increments on every write to the same key — real optimistic versioning. */
  readonly version: number;
}
