/** Real, in-memory {@link RetentionRuleRepository} implementation. @module data-security/repository.impl */
import type { RetentionRuleRepository } from './repository.js';
import type { RetentionRule } from './types.js';

/** Creates a real, in-memory {@link RetentionRuleRepository}. */
export function createRetentionRuleRepository(seed?: readonly RetentionRule[]): RetentionRuleRepository {
  const store = new Map<string, RetentionRule>();
  for (const rule of seed ?? []) store.set(rule.id, rule);

  function list(organizationId: string): RetentionRule[] {
    return [...store.values()].filter((rule) => rule.organizationId === organizationId);
  }

  return {
    async save(rule) {
      store.set(rule.id, rule);
    },
    async findById(organizationId, ruleId) {
      const rule = store.get(ruleId);
      if (!rule || rule.organizationId !== organizationId) return null;
      return rule;
    },
    async findAll(organizationId) {
      return list(organizationId);
    },
    async findByClassification(organizationId, dataClassification) {
      return list(organizationId).find((rule) => rule.dataClassification === dataClassification) ?? null;
    },
  };
}
