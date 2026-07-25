/** Real in-memory {@link DecisionPolicyRepository} implementation. @module policy/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DecisionPolicyId } from '../shared/identifiers.js';
import type { DecisionPolicy } from './types.js';
import type { DecisionPolicyRepository } from './repository.js';

export function createDecisionPolicyRepository(seed?: readonly DecisionPolicy[]): DecisionPolicyRepository {
  const repo = createInMemoryRepository<DecisionPolicy, DecisionPolicyId>({ seed });
  return {
    ...repo,
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((policy) => policy.code === code) ?? null;
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((policy) => policy.status === status);
    },
  };
}
