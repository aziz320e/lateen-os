/** Real, in-memory {@link GovernanceRuleRepository} implementation. @module rules-engine/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { GovernanceRuleRepository } from './repository.js';
import type { GovernanceRule } from './types.js';

/** Creates a real, in-memory {@link GovernanceRuleRepository}. */
export function createGovernanceRuleRepository(seed?: readonly GovernanceRule[]): GovernanceRuleRepository {
  const repo = createInMemoryRepository<GovernanceRule>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByAppliesTo(organizationId, appliesTo) {
      return repo.list(organizationId).filter((rule) => rule.appliesTo === appliesTo);
    },
  };
}
