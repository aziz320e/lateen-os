/** @module delegation/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type {
  CollaborationDelegationId,
  DelegationPolicy,
  DelegationPolicyId,
  DelegationRequest,
} from './types.js';

export interface DelegationRequestRepository extends Repository<DelegationRequest, CollaborationDelegationId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly DelegationRequest[]>;
}
export interface DelegationPolicyRepository extends Repository<DelegationPolicy, DelegationPolicyId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly DelegationPolicy[]>;
}
