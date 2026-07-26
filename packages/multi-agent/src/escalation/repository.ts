/** @module escalation/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type {
  EscalationDecision,
  EscalationDecisionId,
  EscalationRequest,
  EscalationRequestId,
} from './types.js';

export interface EscalationRequestRepository extends Repository<EscalationRequest, EscalationRequestId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly EscalationRequest[]>;
}
export type EscalationDecisionRepository = Repository<EscalationDecision, EscalationDecisionId>;
