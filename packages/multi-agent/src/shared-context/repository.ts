/** @module shared-context/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type {
  SharedBusinessContext,
  SharedBusinessContextId,
  SharedDecisionReference,
  SharedDecisionReferenceId,
  SharedMemoryReference,
  SharedMemoryReferenceId,
} from './types.js';

export interface SharedBusinessContextRepository extends Repository<SharedBusinessContext, SharedBusinessContextId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<SharedBusinessContext | null>;
}
export type SharedMemoryReferenceRepository = Repository<SharedMemoryReference, SharedMemoryReferenceId>;
export type SharedDecisionReferenceRepository = Repository<SharedDecisionReference, SharedDecisionReferenceId>;
