/** Real in-memory escalation repository implementations. @module escalation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { EscalationDecision, EscalationRequest } from './types.js';
import type { EscalationDecisionRepository, EscalationRequestRepository } from './repository.js';

export function createEscalationRequestRepository(seed?: readonly EscalationRequest[]): EscalationRequestRepository {
  const repo = createInMemoryRepository<EscalationRequest>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((request) => request.missionId === missionId);
    },
  };
}

export function createEscalationDecisionRepository(seed?: readonly EscalationDecision[]): EscalationDecisionRepository {
  return createInMemoryRepository<EscalationDecision>({ seed });
}
