/** @module consensus/repository */
import type { Repository } from '../shared/repository.js';
import type { MissionId, OrganizationId } from '../shared/identifiers.js';
import type { Agreement, AgreementId, ConsensusResult, ConsensusResultId } from './types.js';

export interface ConsensusResultRepository extends Repository<ConsensusResult, ConsensusResultId> {
  findByMission(organizationId: OrganizationId, missionId: MissionId): Promise<readonly ConsensusResult[]>;
}
export type AgreementRepository = Repository<Agreement, AgreementId>;
