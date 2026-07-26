/** @module agent/types */
import type { RuntimeAgentId } from '@lateen-os/ai-runtime';
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AgentGroupId, AgentRegistrationId, OrganizationId } from '../shared/identifiers.js';
import type { MissionWorkerRole, Timestamp } from '../shared/primitives.js';

export type { AgentRegistrationId, AgentGroupId, OrganizationId, WorkerId };

export type AgentAvailability = 'available' | 'busy' | 'offline';

/** Descriptor for an agent registered for multi-agent collaboration. */
export interface AgentDescriptor {
  readonly workerId: WorkerId;
  /** Real cross-package reference — the ai-runtime agent actually executing this worker's tasks. */
  readonly runtimeAgentId?: RuntimeAgentId;
  readonly role: MissionWorkerRole;
  readonly capabilities: readonly string[];
  readonly displayName: string;
}

/** Registration record for a collaborating agent — the Agent Registry's aggregate. */
export interface AgentRegistration extends TenantAuditableEntity<AgentRegistrationId> {
  readonly descriptor: AgentDescriptor;
  readonly availability: AgentAvailability;
  readonly active: boolean;
  readonly registeredAt: Timestamp;
  readonly lastActiveAt?: Timestamp;
}

/** Cross-mission grouping of agents (e.g. "finance cluster") — distinct from a mission-scoped MissionTeam. */
export interface AgentGroup extends TenantAuditableEntity<AgentGroupId> {
  readonly name: string;
  readonly description?: string;
  readonly memberWorkerIds: readonly WorkerId[];
}
