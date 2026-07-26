/** @module session/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId, MissionId } from '../shared/identifiers.js';
import type { AgentSession, AgentSessionId, WorkerId } from './types.js';

export interface AgentSessionRepository extends Repository<AgentSession, AgentSessionId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly AgentSession[]>;
  findActiveByWorker(organizationId: OrganizationId, missionId: MissionId, workerId: WorkerId): Promise<AgentSession | null>;
}
