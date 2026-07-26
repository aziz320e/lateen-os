/** Real in-memory consensus repository implementations. @module consensus/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Agreement, ConsensusResult } from './types.js';
import type { AgreementRepository, ConsensusResultRepository } from './repository.js';

export function createConsensusResultRepository(seed?: readonly ConsensusResult[]): ConsensusResultRepository {
  const repo = createInMemoryRepository<ConsensusResult>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((result) => result.missionId === missionId);
    },
  };
}

export function createAgreementRepository(seed?: readonly Agreement[]): AgreementRepository {
  return createInMemoryRepository<Agreement>({ seed });
}
