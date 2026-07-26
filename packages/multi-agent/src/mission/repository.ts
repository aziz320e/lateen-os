/** @module mission/repository */
import type { Repository } from '../shared/repository.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { Mission, MissionId, MissionObjective, MissionObjectiveId, MissionStatus } from './types.js';

export interface MissionRepository extends Repository<Mission, MissionId> {
  findAll(organizationId: OrganizationId): Promise<readonly Mission[]>;
  findByCode(organizationId: OrganizationId, code: string): Promise<Mission | null>;
  findByStatus(organizationId: OrganizationId, status: MissionStatus): Promise<readonly Mission[]>;
}
export type MissionObjectiveRepository = Repository<MissionObjective, MissionObjectiveId>;
