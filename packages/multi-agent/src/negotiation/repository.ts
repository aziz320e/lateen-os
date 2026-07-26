/** @module negotiation/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { Negotiation, NegotiationId, NegotiationRound, NegotiationRoundId } from './types.js';

export interface NegotiationRepository extends Repository<Negotiation, NegotiationId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly Negotiation[]>;
}
export interface NegotiationRoundRepository extends Repository<NegotiationRound, NegotiationRoundId> {
  findByNegotiation(organizationId: OrganizationId, negotiationId: NegotiationId): Promise<readonly NegotiationRound[]>;
}
