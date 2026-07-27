/** Real, in-memory Governance Policy repositories. @module policy/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { GovernancePolicyRepository, GovernancePolicyVersionRepository } from './repository.js';
import type { GovernancePolicy, GovernancePolicyVersion } from './types.js';

/** Creates a real, in-memory {@link GovernancePolicyRepository}. */
export function createGovernancePolicyRepository(seed?: readonly GovernancePolicy[]): GovernancePolicyRepository {
  const repo = createInMemoryRepository<GovernancePolicy>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByType(organizationId, policyType) {
      return repo.list(organizationId).filter((policy) => policy.policyType === policyType);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((policy) => policy.status === status);
    },
  };
}

/** Creates a real, in-memory {@link GovernancePolicyVersionRepository}. */
export function createGovernancePolicyVersionRepository(seed?: readonly GovernancePolicyVersion[]): GovernancePolicyVersionRepository {
  const repo = createInMemoryRepository<GovernancePolicyVersion>({ seed });
  return {
    ...repo,
    async findByPolicyId(organizationId, policyId) {
      return repo.list(organizationId)
        .filter((version) => version.policyId === policyId)
        .sort((a, b) => a.version - b.version);
    },
  };
}
