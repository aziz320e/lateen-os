/** Real in-memory {@link DecisionRuleRepository} implementation. @module rule/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { DecisionRuleId } from '../shared/identifiers.js';
import type { DecisionRule } from './types.js';
import type { DecisionRuleRepository } from './repository.js';

export function createDecisionRuleRepository(seed?: readonly DecisionRule[]): DecisionRuleRepository {
  const repo = createInMemoryRepository<DecisionRule, DecisionRuleId>({ seed });
  return {
    ...repo,
    async findByCode(organizationId, code) {
      return repo.list(organizationId).find((rule) => rule.code === code) ?? null;
    },
    async findByKind(organizationId, kind) {
      return repo.list(organizationId).filter((rule) => rule.kind === kind);
    },
    async findByStatus(organizationId, status) {
      return repo.list(organizationId).filter((rule) => rule.status === status);
    },
  };
}
