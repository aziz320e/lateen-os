/** @module consensus/repository */
import type { Repository } from '../shared/repository.js';
import type { Agreement, AgreementId, ConsensusResult, ConsensusResultId } from './types.js';

export type ConsensusResultRepository = Repository<ConsensusResult, ConsensusResultId>;
export type AgreementRepository = Repository<Agreement, AgreementId>;
