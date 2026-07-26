/** Real in-memory negotiation repository implementations. @module negotiation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Negotiation, NegotiationRound } from './types.js';
import type { NegotiationRepository, NegotiationRoundRepository } from './repository.js';

export function createNegotiationRepository(seed?: readonly Negotiation[]): NegotiationRepository {
  const repo = createInMemoryRepository<Negotiation>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((negotiation) => negotiation.missionId === missionId);
    },
  };
}

export function createNegotiationRoundRepository(seed?: readonly NegotiationRound[]): NegotiationRoundRepository {
  const repo = createInMemoryRepository<NegotiationRound>({ seed });
  return {
    ...repo,
    async findByNegotiation(organizationId, negotiationId) {
      return repo.list(organizationId).filter((round) => round.negotiationId === negotiationId);
    },
  };
}
