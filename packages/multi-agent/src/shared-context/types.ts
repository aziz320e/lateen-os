/** @module shared-context/types */
import type { DecisionId } from '@lateen-os/decision-engine';
import type { KnowledgeEntryId } from '@lateen-os/institutional-memory';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type {
  MissionId,
  OrganizationId,
  SharedBusinessContextId,
  SharedDecisionReferenceId,
  SharedMemoryReferenceId,
} from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

/** Reference to institutional memory shared across mission workers. */
export interface SharedMemoryReference extends TenantAuditableEntity<SharedMemoryReferenceId> {
  readonly contextId: SharedBusinessContextId;
  readonly knowledgeEntryId: KnowledgeEntryId;
  readonly label: string;
  readonly sharedAt: Timestamp;
}

/** Reference to a Decision Engine decision shared in mission context. */
export interface SharedDecisionReference extends TenantAuditableEntity<SharedDecisionReferenceId> {
  readonly contextId: SharedBusinessContextId;
  readonly decisionId: DecisionId;
  readonly summary: string;
  readonly sharedAt: Timestamp;
}

/** Shared business context accessible to all mission participants. */
export interface SharedBusinessContext extends TenantAuditableEntity<SharedBusinessContextId> {
  readonly missionId: MissionId;
  readonly title: string;
  readonly memoryReferenceIds: readonly SharedMemoryReferenceId[];
  readonly decisionReferenceIds: readonly SharedDecisionReferenceId[];
  readonly snapshot: Readonly<Record<string, unknown>>;
  readonly version: number;
}

export type {
  SharedBusinessContextId,
  SharedMemoryReferenceId,
  SharedDecisionReferenceId,
  OrganizationId,
};
