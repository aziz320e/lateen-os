/** @module conflict/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { Conflict, ConflictId } from './types.js';

export interface ConflictRepository extends Repository<Conflict, ConflictId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly Conflict[]>;
}
