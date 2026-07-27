/** Real, in-memory {@link ComplianceRetentionRuleRepository} implementation. @module retention/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { ComplianceRetentionRuleRepository } from './repository.js';
import type { ComplianceRetentionRule } from './types.js';

/** Creates a real, in-memory {@link ComplianceRetentionRuleRepository}. */
export function createComplianceRetentionRuleRepository(seed?: readonly ComplianceRetentionRule[]): ComplianceRetentionRuleRepository {
  const repo = createInMemoryRepository<ComplianceRetentionRule>({ seed });
  return {
    ...repo,
    async findAll(organizationId) {
      return repo.list(organizationId);
    },
    async findByDataCategory(organizationId, dataCategory) {
      return repo.list(organizationId).find((rule) => rule.dataCategory === dataCategory) ?? null;
    },
  };
}
