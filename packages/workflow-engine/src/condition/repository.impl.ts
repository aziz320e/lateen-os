/** Real in-memory {@link ExpressionRepository} / {@link RuleRepository} / {@link PolicyConditionRepository} implementations. @module condition/repository.impl */
import { createInMemoryRepository } from '@lateen-os/shared-kernel/repository';
import type { Expression, PolicyCondition, Rule } from './types.js';
import type { ExpressionRepository, PolicyConditionRepository, RuleRepository } from './repository.js';

export function createExpressionRepository(seed?: readonly Expression[]): ExpressionRepository {
  return createInMemoryRepository<Expression>({ seed });
}

export function createRuleRepository(seed?: readonly Rule[]): RuleRepository {
  return createInMemoryRepository<Rule>({ seed });
}

export function createPolicyConditionRepository(seed?: readonly PolicyCondition[]): PolicyConditionRepository {
  return createInMemoryRepository<PolicyCondition>({ seed });
}
