/** @module vision-mission/repository */
import type { OrganizationId } from '../shared/identifiers.js';
import type { Repository } from '../shared/repository.js';
import type { VisionMission, VisionMissionId } from './types.js';

/** Persistence port for the Vision & Mission singleton (id === organizationId). */
export interface VisionMissionRepository extends Repository<VisionMission, VisionMissionId> {
  findByOrganization(organizationId: OrganizationId): Promise<VisionMission | null>;
}
