/** @module session/types */
import type { WorkerId } from '@lateen-os/ai-workforce';
import type { TenantAuditableEntity } from '../shared/entity.js';
import type { AgentSessionId, MissionId, OrganizationId } from '../shared/identifiers.js';
import type { Timestamp } from '../shared/primitives.js';

export type { AgentSessionId, OrganizationId, WorkerId };

export type AgentSessionStatus = 'active' | 'ended';

/** A worker's live engagement window within a mission. */
export interface AgentSession extends TenantAuditableEntity<AgentSessionId> {
  readonly missionId: MissionId;
  readonly workerId: WorkerId;
  readonly status: AgentSessionStatus;
  readonly startedAt: Timestamp;
  readonly endedAt?: Timestamp;
  readonly lastActiveAt: Timestamp;
}
