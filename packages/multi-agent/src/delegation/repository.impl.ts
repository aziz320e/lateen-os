/** Real in-memory delegation repository implementations. @module delegation/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DelegationPolicy, DelegationRequest } from './types.js';
import type { DelegationPolicyRepository, DelegationRequestRepository } from './repository.js';

export function createDelegationRequestRepository(seed?: readonly DelegationRequest[]): DelegationRequestRepository {
  const repo = createInMemoryRepository<DelegationRequest>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((request) => request.missionId === missionId);
    },
  };
}

export function createDelegationPolicyRepository(seed?: readonly DelegationPolicy[]): DelegationPolicyRepository {
  const repo = createInMemoryRepository<DelegationPolicy>({ seed });
  return {
    ...repo,
    async findByMission(organizationId, missionId) {
      return repo.list(organizationId).filter((policy) => policy.missionId === missionId);
    },
  };
}
