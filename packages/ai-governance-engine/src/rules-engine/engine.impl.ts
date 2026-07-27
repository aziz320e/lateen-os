/**
 * Real Governance Rules Engine — evaluates deterministic rules against
 * runtime actions, workflow executions, AI provider usage,
 * communication requests, and business operations. Rules are evaluated
 * in id-sorted order for determinism: the first matching `deny` rule
 * wins outright (and publishes `governance.violation.detected`); absent
 * a deny, the first matching `flag` rule allows but surfaces a reason;
 * absent both, the first matching `allow` rule allows explicitly;
 * absent any match, the default is allow.
 *
 * @module rules-engine/engine.impl
 */
import type { GovernanceEventBus } from '../events/governance-event-bus.js';
import { GovernanceRuleNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { GovernanceRuleId, OrganizationId } from '../shared/identifiers.js';
import type { GovernanceRuleRepository } from './repository.js';
import type { EvaluateGovernanceInput, GovernanceEvaluation, GovernanceRule, GovernanceRuleCondition, GovernanceRuleTarget } from './types.js';

/** Pure: whether every condition matches the given attributes (AND semantics). */
export function matchesConditions(attributes: Readonly<Record<string, unknown>>, conditions: readonly GovernanceRuleCondition[]): boolean {
  return conditions.every((condition) => {
    const actual = attributes[condition.attribute];
    if (condition.operator === 'eq') return actual === condition.value;
    if (condition.operator === 'neq') return actual !== condition.value;
    return Array.isArray(condition.value) ? condition.value.includes(actual) : actual === condition.value;
  });
}

export interface CreateGovernanceRuleInput {
  readonly name: string;
  readonly appliesTo: GovernanceRuleTarget;
  readonly conditions: readonly GovernanceRuleCondition[];
  readonly effect: GovernanceRule['effect'];
}

export interface GovernanceRulesEngine {
  createRule(organizationId: OrganizationId, input: CreateGovernanceRuleInput): Promise<GovernanceRule>;
  archiveRule(organizationId: OrganizationId, ruleId: GovernanceRuleId): Promise<GovernanceRule>;
  listRules(organizationId: OrganizationId, appliesTo?: GovernanceRuleTarget): Promise<readonly GovernanceRule[]>;
  evaluate(organizationId: OrganizationId, input: EvaluateGovernanceInput): Promise<GovernanceEvaluation>;
}

/** Creates a real {@link GovernanceRulesEngine} backed by a {@link GovernanceRuleRepository}. */
export function createGovernanceRulesEngine(
  repository: GovernanceRuleRepository,
  eventBus?: GovernanceEventBus,
  now: () => string = nowIso,
): GovernanceRulesEngine {
  return {
    async createRule(organizationId, input) {
      const timestamp = now();
      const rule: GovernanceRule = {
        id: generateId('governance-rule'),
        organizationId,
        createdAt: timestamp,
        updatedAt: timestamp,
        name: input.name,
        appliesTo: input.appliesTo,
        conditions: input.conditions,
        effect: input.effect,
        status: 'active',
      };
      await repository.save(rule);
      return rule;
    },

    async archiveRule(organizationId, ruleId) {
      const rule = await repository.findById(organizationId, ruleId);
      if (!rule) throw new GovernanceRuleNotFoundError(ruleId);
      const updated: GovernanceRule = { ...rule, status: 'archived', updatedAt: now() };
      await repository.save(updated);
      return updated;
    },

    async listRules(organizationId, appliesTo) {
      return appliesTo ? repository.findByAppliesTo(organizationId, appliesTo) : repository.findAll(organizationId);
    },

    async evaluate(organizationId, input) {
      const candidates = (await repository.findByAppliesTo(organizationId, input.appliesTo))
        .filter((rule) => rule.status === 'active')
        .filter((rule) => matchesConditions(input.attributes, rule.conditions))
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

      const denyMatch = candidates.find((rule) => rule.effect === 'deny');
      if (denyMatch) {
        eventBus?.publish('governance.violation.detected', {
          organizationId,
          ruleId: denyMatch.id,
          appliesTo: input.appliesTo,
          reason: denyMatch.name,
        });
        return { allowed: false, matchedRuleId: denyMatch.id, effect: 'deny', reason: denyMatch.name };
      }

      const flagMatch = candidates.find((rule) => rule.effect === 'flag');
      if (flagMatch) {
        return { allowed: true, matchedRuleId: flagMatch.id, effect: 'flag', reason: flagMatch.name };
      }

      const allowMatch = candidates.find((rule) => rule.effect === 'allow');
      if (allowMatch) {
        return { allowed: true, matchedRuleId: allowMatch.id, effect: 'allow' };
      }

      return { allowed: true };
    },
  };
}
