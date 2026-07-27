/**
 * Real Retention Engine — deterministic retention rules for audit
 * evidence, compliance reports, assessment history, and policy
 * history. One rule per data category.
 *
 * @module retention/engine.impl
 */
import { ComplianceRetentionRuleNotFoundError } from '../shared/errors.js';
import { generateId, nowIso } from '../shared/id.js';
import type { OrganizationId } from '../shared/identifiers.js';
import type { ComplianceRetentionRuleRepository } from './repository.js';
import type { ComplianceRetentionRule, RetentionDataCategory } from './types.js';

/** Pure: whether a record created at `createdAt` has exceeded the rule's retention window as of `asOf`. */
export function isRetentionExpired(rule: Pick<ComplianceRetentionRule, 'retentionDays'>, createdAt: string, asOf: string): boolean {
  const createdMs = new Date(createdAt).getTime();
  const asOfMs = new Date(asOf).getTime();
  const retentionMs = rule.retentionDays * 24 * 60 * 60 * 1000;
  return asOfMs - createdMs > retentionMs;
}

export interface SetRetentionRuleInput {
  readonly dataCategory: RetentionDataCategory;
  readonly retentionDays: number;
}

export interface RetentionEngine {
  setRule(organizationId: OrganizationId, input: SetRetentionRuleInput): Promise<ComplianceRetentionRule>;
  getRule(organizationId: OrganizationId, dataCategory: RetentionDataCategory): Promise<ComplianceRetentionRule | null>;
  listRules(organizationId: OrganizationId): Promise<readonly ComplianceRetentionRule[]>;
  /** Real, deterministic check against the rule (if any) set for the given data category. `false` when no rule is configured. */
  isExpired(organizationId: OrganizationId, dataCategory: RetentionDataCategory, createdAt: string, asOf?: string): Promise<boolean>;
  requireRule(organizationId: OrganizationId, dataCategory: RetentionDataCategory): Promise<ComplianceRetentionRule>;
}

/** Creates a real {@link RetentionEngine} backed by a {@link ComplianceRetentionRuleRepository}. */
export function createRetentionEngine(
  repository: ComplianceRetentionRuleRepository,
  now: () => string = nowIso,
): RetentionEngine {
  return {
    async setRule(organizationId, input) {
      const existing = await repository.findByDataCategory(organizationId, input.dataCategory);
      const timestamp = now();
      const rule: ComplianceRetentionRule = existing
        ? { ...existing, retentionDays: input.retentionDays, updatedAt: timestamp }
        : {
            id: generateId('retention-rule'),
            organizationId,
            createdAt: timestamp,
            updatedAt: timestamp,
            dataCategory: input.dataCategory,
            retentionDays: input.retentionDays,
          };
      await repository.save(rule);
      return rule;
    },

    async getRule(organizationId, dataCategory) {
      return repository.findByDataCategory(organizationId, dataCategory);
    },

    async listRules(organizationId) {
      return repository.findAll(organizationId);
    },

    async isExpired(organizationId, dataCategory, createdAt, asOf) {
      const rule = await repository.findByDataCategory(organizationId, dataCategory);
      if (!rule) return false;
      return isRetentionExpired(rule, createdAt, asOf ?? now());
    },

    async requireRule(organizationId, dataCategory) {
      const rule = await repository.findByDataCategory(organizationId, dataCategory);
      if (!rule) throw new ComplianceRetentionRuleNotFoundError(dataCategory);
      return rule;
    },
  };
}
